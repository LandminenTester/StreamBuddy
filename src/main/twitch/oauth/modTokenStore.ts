import { safeStorage } from 'electron'
import {
  clearModAuthToken,
  getStoredModAuthToken,
  upsertModAuthToken
} from '../../db/repositories/modAuthTokens.repo'
import { AppError } from '../../appError'
import type { DecryptedTokens } from './tokenStore'

export function storeModTokens(data: {
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

  upsertModAuthToken({
    twitchUserId: data.twitchUserId,
    twitchLogin: data.twitchLogin,
    accessTokenEnc: safeStorage.encryptString(data.accessToken),
    refreshTokenEnc: safeStorage.encryptString(data.refreshToken),
    scopes: data.scopes,
    expiresAt: data.expiresAt
  })
}

export function readModTokens(): DecryptedTokens | null {
  const row = getStoredModAuthToken()
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

export function clearModTokens(): void {
  clearModAuthToken()
}
