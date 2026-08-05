import { helixFetch } from './helixClient'

/**
 * Twitch hat chat-befehlsbasierte Moderation (/timeout, /ban, /unban als IRC-Nachricht)
 * im Februar 2023 abgeschafft -- Bans/Timeouts muessen seither ueber die Helix-
 * Moderation-API laufen. Braucht `moderator:manage:banned_users`, moderator_id muss
 * der User-ID des sendenden Tokens entsprechen.
 */
export async function banUser(
  broadcasterId: string,
  moderatorId: string,
  targetUserId: string,
  durationSeconds?: number,
  reason?: string
): Promise<void> {
  const response = await helixFetch(
    `/moderation/bans?broadcaster_id=${encodeURIComponent(broadcasterId)}&moderator_id=${encodeURIComponent(moderatorId)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        data: {
          user_id: targetUserId,
          ...(durationSeconds !== undefined ? { duration: durationSeconds } : {}),
          ...(reason !== undefined ? { reason } : {})
        }
      })
    }
  )
  if (!response.ok) {
    throw new Error(`Ban/Timeout fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
}

export async function unbanUser(
  broadcasterId: string,
  moderatorId: string,
  targetUserId: string
): Promise<void> {
  const response = await helixFetch(
    `/moderation/bans?broadcaster_id=${encodeURIComponent(broadcasterId)}&moderator_id=${encodeURIComponent(moderatorId)}&user_id=${encodeURIComponent(targetUserId)}`,
    { method: 'DELETE' }
  )
  if (!response.ok) {
    throw new Error(`Unban fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
}
