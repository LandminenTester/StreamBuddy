import { requireTwitchClientId } from '../oauth/clientId'
import { resolvePreferredActor } from '../oauth/actorResolver'

const HELIX_BASE_URL = 'https://api.twitch.tv/helix'
const SHOUTOUT_SCOPE = 'moderator:manage:shoutouts'

export type ShoutoutResult =
  | { ok: true }
  | { ok: false; reason: 'no_actor' | 'rate_limited' | 'request_failed'; detail?: string }

/**
 * Sendet einen Twitch-Shoutout an einen anderen Kanal.
 * @param fromBroadcasterId Kanal, der den Shoutout sendet (eigener Kanal)
 * @param toBroadcasterId Kanal, der den Shoutout erhaelt
 */
export async function sendShoutout(
  fromBroadcasterId: string,
  toBroadcasterId: string
): Promise<ShoutoutResult> {
  const actor = await resolvePreferredActor(SHOUTOUT_SCOPE)
  if (!actor) return { ok: false, reason: 'no_actor' }

  const params = new URLSearchParams({
    from_broadcaster_id: fromBroadcasterId,
    to_broadcaster_id: toBroadcasterId,
    moderator_id: actor.userId
  })

  const request = async (accessToken: string): Promise<Response> =>
    fetch(`${HELIX_BASE_URL}/chat/shoutouts?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Client-Id': requireTwitchClientId(),
        Authorization: `Bearer ${accessToken}`
      }
    })

  let response = await request(actor.accessToken)

  if (response.status === 401) {
    const refreshed = await actor.refresh()
    if (!refreshed) return { ok: false, reason: 'no_actor' }
    response = await request(refreshed.accessToken)
  }

  // 429 ist bei Shoutouts der Normalfall, kein Fehler: Twitch erlaubt einen Shoutout
  // alle 2 Minuten und pro Zielkanal nur alle 60 Minuten.
  if (response.status === 429) return { ok: false, reason: 'rate_limited' }

  if (!response.ok) {
    return { ok: false, reason: 'request_failed', detail: `${response.status} ${await response.text()}` }
  }

  return { ok: true }
}
