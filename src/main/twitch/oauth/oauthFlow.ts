import { shell } from 'electron'
import type { DeviceAuthPrompt } from '@shared/types/auth'
import { storeTokens } from './tokenStore'
import { getRequiredScopesForEnabledFeatures } from './scopeRegistry'
import { requireTwitchClientId } from './clientId'
import { logger } from '../../logger'
import { AppError } from '../../appError'

const DEVICE_ENDPOINT = 'https://id.twitch.tv/oauth2/device'
const TOKEN_ENDPOINT = 'https://id.twitch.tv/oauth2/token'
const VALIDATE_ENDPOINT = 'https://id.twitch.tv/oauth2/validate'

interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string[]
}

interface ValidateResponse {
  user_id: string
  login: string
  scopes: string[]
}

/**
 * Twitch unterstützt für den Authorization-Code-Grant kein PKCE -- der verlangt
 * immer ein client_secret. Für Public Clients ohne Secret ist stattdessen der
 * Device Code Grant Flow (DCF) der korrekte Weg: Device-Code anfordern, dem
 * Nutzer den User-Code + Verification-URL zeigen (siehe onDeviceCodeReady),
 * dann auf die Autorisierung pollen.
 */
export async function runOAuthFlow(
  onDeviceCodeReady: (prompt: DeviceAuthPrompt) => void
): Promise<{ twitchLogin: string; grantedScopes: string[] }> {
  const clientId = requireTwitchClientId()
  const scopes = getRequiredScopesForEnabledFeatures()
  const device = await requestDeviceCode(clientId, scopes)

  onDeviceCodeReady({
    userCode: device.user_code,
    verificationUri: device.verification_uri,
    expiresInSeconds: device.expires_in
  })
  void shell.openExternal(device.verification_uri)

  const tokenResponse = await pollForToken(clientId, scopes, device)

  const {
    login,
    scopes: grantedScopes,
    user_id: userId
  } = await validateToken(tokenResponse.access_token)

  storeTokens({
    twitchUserId: userId,
    twitchLogin: login,
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    scopes: grantedScopes,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000
  })

  logger.info(`Twitch-Bot-Account verbunden: ${login}`)

  return { twitchLogin: login, grantedScopes }
}

async function requestDeviceCode(clientId: string, scopes: string[]): Promise<DeviceCodeResponse> {
  const body = new URLSearchParams({ client_id: clientId, scopes: scopes.join(' ') })
  const response = await fetch(DEVICE_ENDPOINT, { method: 'POST', body })

  if (!response.ok) {
    throw new AppError(
      'errors.oauth.deviceCodeRequestFailed',
      `Device-Code-Anfrage fehlgeschlagen: ${response.status} ${await response.text()}`
    )
  }
  return (await response.json()) as DeviceCodeResponse
}

async function pollForToken(
  clientId: string,
  scopes: string[],
  device: DeviceCodeResponse
): Promise<TokenResponse> {
  let intervalMs = device.interval * 1000
  const deadline = Date.now() + device.expires_in * 1000

  while (Date.now() < deadline) {
    await sleep(intervalMs)

    const body = new URLSearchParams({
      client_id: clientId,
      scopes: scopes.join(' '),
      device_code: device.device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })
    const response = await fetch(TOKEN_ENDPOINT, { method: 'POST', body })

    if (response.ok) {
      return (await response.json()) as TokenResponse
    }

    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null
    const message = (errorBody?.message ?? '').toLowerCase()

    if (message.includes('authorization_pending')) continue
    if (message.includes('slow_down')) {
      intervalMs += 5000
      continue
    }

    throw new AppError(
      'errors.oauth.tokenRequestFailed',
      `Device-Code-Autorisierung fehlgeschlagen: ${response.status} ${message}`
    )
  }

  throw new AppError(
    'errors.oauth.deviceCodeExpired',
    'Device-Code abgelaufen -- Autorisierung nicht rechtzeitig abgeschlossen'
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function validateToken(accessToken: string): Promise<ValidateResponse> {
  const response = await fetch(VALIDATE_ENDPOINT, {
    headers: { Authorization: `OAuth ${accessToken}` }
  })
  if (!response.ok) {
    throw new AppError(
      'errors.oauth.tokenRequestFailed',
      `Token-Validierung fehlgeschlagen: ${response.status}`
    )
  }
  return (await response.json()) as ValidateResponse
}
