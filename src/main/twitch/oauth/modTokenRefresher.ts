import { readModTokens, storeModTokens } from './modTokenStore'
import { requireTwitchClientId } from './clientId'
import { logger } from '../../logger'
import { AppError } from '../../appError'
import type { DecryptedTokens } from './tokenStore'

const TOKEN_ENDPOINT = 'https://id.twitch.tv/oauth2/token'
const REFRESH_MARGIN_MS = 5 * 60 * 1000

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string[]
}

async function refreshModAccessToken(current: DecryptedTokens): Promise<DecryptedTokens> {
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
      `Twitch Mod-Token-Refresh fehlgeschlagen: ${response.status} ${await response.text()}`
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

  storeModTokens(updated)
  logger.info('Twitch-Mod-Token erfolgreich erneuert')

  return updated
}

/**
 * Liefert ein gültiges Access-Token für den Mod-Account.
 * Gibt null zurück, falls kein Mod-Account verbunden ist.
 */
export async function getValidModAccessToken(): Promise<DecryptedTokens | null> {
  const tokens = readModTokens()
  if (!tokens) return null

  if (tokens.expiresAt - Date.now() > REFRESH_MARGIN_MS) {
    return tokens
  }

  return refreshModAccessToken(tokens)
}

/** Reaktiver Fallback: erzwingt einen Refresh des Mod-Tokens nach HTTP 401. */
export async function forceModRefresh(): Promise<DecryptedTokens | null> {
  const tokens = readModTokens()
  if (!tokens) return null
  return refreshModAccessToken(tokens)
}
