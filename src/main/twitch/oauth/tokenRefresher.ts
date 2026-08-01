import { readTokens, storeTokens, type DecryptedTokens } from './tokenStore'
import { requireTwitchClientId } from './clientId'
import { logger } from '../../logger'
import { AppError } from '../../appError'

const TOKEN_ENDPOINT = 'https://id.twitch.tv/oauth2/token'
/** Proaktiver Refresh, sobald weniger als 5 Minuten Restlaufzeit verbleiben. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string[]
}

async function refreshAccessToken(current: DecryptedTokens): Promise<DecryptedTokens> {
  const clientId = requireTwitchClientId()

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: current.refreshToken
  })

  const response = await fetch(TOKEN_ENDPOINT, { method: 'POST', body })

  if (!response.ok) {
    throw new AppError(
      'errors.oauth.tokenRefreshFailed',
      `Twitch Token-Refresh fehlgeschlagen: ${response.status} ${await response.text()}`
    )
  }

  const data = (await response.json()) as TokenResponse
  const expiresAt = Date.now() + data.expires_in * 1000

  const updated: DecryptedTokens = {
    ...current,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    scopes: data.scope,
    expiresAt
  }

  storeTokens(updated)
  logger.info('Twitch-Token erfolgreich erneuert')

  return updated
}

/**
 * Liefert ein gültiges Access-Token für Helix-/tmi.js-Aufrufe. Refresht proaktiv,
 * falls die Restlaufzeit unter REFRESH_MARGIN_MS liegt. Wirft, falls kein Bot-Account
 * verbunden ist.
 */
export async function getValidAccessToken(): Promise<DecryptedTokens> {
  const tokens = readTokens()
  if (!tokens) {
    throw new AppError('errors.oauth.noTokenStored', 'Kein Twitch-Bot-Account verbunden')
  }

  if (tokens.expiresAt - Date.now() > REFRESH_MARGIN_MS) {
    return tokens
  }

  return refreshAccessToken(tokens)
}

/** Reaktiver Fallback: erzwingt einen Refresh, z.B. nach einem HTTP 401 von Helix. */
export async function forceRefresh(): Promise<DecryptedTokens> {
  const tokens = readTokens()
  if (!tokens) {
    throw new AppError('errors.oauth.noTokenStored', 'Kein Twitch-Bot-Account verbunden')
  }
  return refreshAccessToken(tokens)
}
