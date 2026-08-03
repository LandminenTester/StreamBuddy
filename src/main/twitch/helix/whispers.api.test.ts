import { beforeEach, describe, expect, it, vi } from 'vitest'
import { helixFetch } from './helixClient'
import { getUserIdByLogin } from './users.api'
import { getValidAccessToken } from '../oauth/tokenRefresher'
import { sendWhisper } from './whispers.api'

vi.mock('./helixClient', () => ({ helixFetch: vi.fn() }))
vi.mock('./users.api', () => ({ getUserIdByLogin: vi.fn() }))
vi.mock('../oauth/tokenRefresher', () => ({ getValidAccessToken: vi.fn() }))

const tokens = {
  twitchUserId: 'bot-123',
  twitchLogin: 'streambuddy',
  accessToken: 'token',
  refreshToken: 'refresh',
  scopes: ['user:manage:whispers'],
  expiresAt: Date.now() + 60_000
}

describe('sendWhisper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getValidAccessToken).mockResolvedValue(tokens)
    vi.mocked(getUserIdByLogin).mockResolvedValue('viewer-456')
    vi.mocked(helixFetch).mockResolvedValue(new Response(null, { status: 204 }))
  })

  it('sends private messages through the Helix Whisper endpoint', async () => {
    await sendWhisper('@ViewerName', ' Geheime Auswahl ')

    expect(getUserIdByLogin).toHaveBeenCalledWith('viewername')
    expect(helixFetch).toHaveBeenCalledWith(
      '/whispers?from_user_id=bot-123&to_user_id=viewer-456',
      {
        method: 'POST',
        body: JSON.stringify({ message: 'Geheime Auswahl' })
      }
    )
  })

  it('rejects delivery when the required Twitch permission is missing', async () => {
    vi.mocked(getValidAccessToken).mockResolvedValue({ ...tokens, scopes: [] })

    await expect(sendWhisper('viewername', 'Auswahl')).rejects.toThrow(
      'user:manage:whispers'
    )
    expect(helixFetch).not.toHaveBeenCalled()
  })
})
