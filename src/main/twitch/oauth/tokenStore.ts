import { safeStorage } from 'electron'
import {
  clearAuthToken,
  getStoredAuthToken,
  upsertAuthToken
} from '../../db/repositories/authTokens.repo'
import { AppError } from '../../appError'

export interface DecryptedTokens {
  twitchUserId: string
  twitchLogin: string
  accessToken: string
  refreshToken: string
  scopes: string[]
  expiresAt: number
}

/** Persistiert Access-/Refresh-Token verschlüsselt via Electron safeStorage. */
export function storeTokens(data: {
  twitchUserId: string
  twitchLogin: string
  accessToken: string
  refreshToken: string
  scopes: string[]
  expiresAt: number
}): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new AppError(
      'errors.oauth.encryptionUnavailable',
      'safeStorage-Verschlüsselung ist auf diesem System nicht verfügbar (OS-Keychain fehlt)'
    )
  }

  upsertAuthToken({
    twitchUserId: data.twitchUserId,
    twitchLogin: data.twitchLogin,
    accessTokenEnc: safeStorage.encryptString(data.accessToken),
    refreshTokenEnc: safeStorage.encryptString(data.refreshToken),
    scopes: data.scopes,
    expiresAt: data.expiresAt
  })
}

/** Liest und entschlüsselt die gespeicherten Tokens, falls vorhanden. */
export function readTokens(): DecryptedTokens | null {
  const row = getStoredAuthToken()
  if (!row) return null

  return {
    twitchUserId: row.twitch_user_id,
    twitchLogin: row.twitch_login,
    accessToken: safeStorage.decryptString(row.access_token_enc),
    refreshToken: safeStorage.decryptString(row.refresh_token_enc),
    scopes: JSON.parse(row.scopes) as string[],
    expiresAt: row.expires_at
  }
}

export function clearTokens(): void {
  clearAuthToken()
}
