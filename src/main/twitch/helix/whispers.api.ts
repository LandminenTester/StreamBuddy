import { helixFetch } from './helixClient'
import { getUserIdByLogin } from './users.api'
import { getValidAccessToken } from '../oauth/tokenRefresher'

/** Sendet eine private Twitch-Nachricht ueber die offizielle Helix Whisper API. */
export async function sendWhisper(toLogin: string, message: string): Promise<void> {
  const login = toLogin.trim().replace(/^@/, '').toLowerCase()
  const text = message.trim()
  if (!login || !text) throw new Error('Whisper-Empfaenger oder Nachricht fehlt')

  const tokens = await getValidAccessToken()
  if (!tokens.scopes.includes('user:manage:whispers')) {
    throw new Error('Twitch-Berechtigung user:manage:whispers fehlt')
  }

  const recipientId = await getUserIdByLogin(login)
  if (!recipientId) throw new Error(`Twitch-Nutzer "${login}" wurde nicht gefunden`)

  const params = new URLSearchParams({
    from_user_id: tokens.twitchUserId,
    to_user_id: recipientId
  })
  const response = await helixFetch(`/whispers?${params}`, {
    method: 'POST',
    body: JSON.stringify({ message: text })
  })

  if (!response.ok) {
    throw new Error(
      `Twitch-Whisper an "${login}" fehlgeschlagen: ${response.status} ${await response.text()}`
    )
  }
}
