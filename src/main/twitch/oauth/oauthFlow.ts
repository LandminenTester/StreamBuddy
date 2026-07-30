import { createServer, type Server } from 'node:http'
import { randomBytes, createHash } from 'node:crypto'
import type { BrowserWindow } from 'electron'
import { createOAuthWindow } from '../../window'
import { storeTokens } from './tokenStore'
import { getRequiredScopesForEnabledFeatures } from './scopeRegistry'
import { logger } from '../../logger'

const AUTHORIZE_ENDPOINT = 'https://id.twitch.tv/oauth2/authorize'
const TOKEN_ENDPOINT = 'https://id.twitch.tv/oauth2/token'
const VALIDATE_ENDPOINT = 'https://id.twitch.tv/oauth2/validate'

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

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64url')
}

function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64UrlEncode(randomBytes(32))
  const challenge = base64UrlEncode(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

/**
 * Führt den vollständigen Authorization-Code+PKCE-Flow für den Twitch-Bot-Account
 * aus: BrowserWindow -> Twitch-Login -> lokaler Loopback-Redirect -> Token-Tausch.
 * Fordert die Vereinigungsmenge der Scopes aller aktuell aktivierten Features an
 * (siehe scopeRegistry.ts) -- ein Reauth erweitert bestehende Grants, ohne sie zu invalidieren.
 */
export async function runOAuthFlow(): Promise<{ twitchLogin: string; grantedScopes: string[] }> {
  const clientId = import.meta.env.MAIN_VITE_TWITCH_CLIENT_ID
  const redirectUri = import.meta.env.MAIN_VITE_TWITCH_REDIRECT_URI

  if (!clientId || !redirectUri) {
    throw new Error(
      'MAIN_VITE_TWITCH_CLIENT_ID / MAIN_VITE_TWITCH_REDIRECT_URI fehlen (.env aus .env.example anlegen)'
    )
  }

  const redirectUrl = new URL(redirectUri)
  const port = Number(redirectUrl.port || 80)
  const { verifier, challenge } = generatePkcePair()
  const state = base64UrlEncode(randomBytes(16))
  const scopes = getRequiredScopesForEnabledFeatures()

  const authorizeUrl = new URL(AUTHORIZE_ENDPOINT)
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', scopes.join(' '))
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('code_challenge', challenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')
  authorizeUrl.searchParams.set('force_verify', 'true')

  const code = await waitForAuthorizationCode(authorizeUrl.toString(), redirectUrl, port, state)

  const tokenResponse = await exchangeCodeForToken({
    clientId,
    redirectUri,
    code,
    verifier
  })

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

function waitForAuthorizationCode(
  authorizeUrl: string,
  redirectUrl: URL,
  port: number,
  expectedState: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let oauthWindow: BrowserWindow | null = null
    let server: Server | null = null
    let settled = false

    const cleanup = (): void => {
      server?.close()
      if (oauthWindow && !oauthWindow.isDestroyed()) oauthWindow.close()
    }

    const finish = (result: { ok: true; code: string } | { ok: false; error: Error }): void => {
      if (settled) return
      settled = true
      cleanup()
      if (result.ok) resolve(result.code)
      else reject(result.error)
    }

    server = createServer((req, res) => {
      const requestUrl = new URL(req.url ?? '/', `http://localhost:${port}`)
      if (requestUrl.pathname !== redirectUrl.pathname) {
        res.writeHead(404).end()
        return
      }

      const error = requestUrl.searchParams.get('error')
      const code = requestUrl.searchParams.get('code')
      const state = requestUrl.searchParams.get('state')

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(
        error
          ? '<html><body>Verbindung abgebrochen. Dieses Fenster kann geschlossen werden.</body></html>'
          : '<html><body>Erfolgreich verbunden. Dieses Fenster kann geschlossen werden.</body></html>'
      )

      if (error) {
        finish({ ok: false, error: new Error(`Twitch-OAuth-Fehler: ${error}`) })
        return
      }
      if (!code || state !== expectedState) {
        finish({ ok: false, error: new Error('Ungültige OAuth-Antwort (state/code fehlt)') })
        return
      }
      finish({ ok: true, code })
    })

    server.on('error', (error) => finish({ ok: false, error }))
    server.listen(port, () => {
      oauthWindow = createOAuthWindow(authorizeUrl)
      oauthWindow.on('closed', () => {
        finish({ ok: false, error: new Error('OAuth-Fenster wurde geschlossen') })
      })
    })
  })
}

async function exchangeCodeForToken(params: {
  clientId: string
  redirectUri: string
  code: string
  verifier: string
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    code: params.code,
    grant_type: 'authorization_code',
    redirect_uri: params.redirectUri,
    code_verifier: params.verifier
  })

  const response = await fetch(TOKEN_ENDPOINT, { method: 'POST', body })
  if (!response.ok) {
    throw new Error(`Token-Tausch fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
  return (await response.json()) as TokenResponse
}

async function validateToken(accessToken: string): Promise<ValidateResponse> {
  const response = await fetch(VALIDATE_ENDPOINT, {
    headers: { Authorization: `OAuth ${accessToken}` }
  })
  if (!response.ok) {
    throw new Error(`Token-Validierung fehlgeschlagen: ${response.status}`)
  }
  return (await response.json()) as ValidateResponse
}
