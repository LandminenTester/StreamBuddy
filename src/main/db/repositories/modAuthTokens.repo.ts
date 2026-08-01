import { getDb } from '../connection'
import type { StoredAuthTokenRow } from './authTokens.repo'

export function getStoredModAuthToken(): StoredAuthTokenRow | null {
  const row = getDb()
    .prepare<[], StoredAuthTokenRow>('SELECT * FROM mod_account_tokens WHERE id = 1')
    .get()
  return row ?? null
}

export function upsertModAuthToken(data: {
  twitchUserId: string
  twitchLogin: string
  accessTokenEnc: Buffer
  refreshTokenEnc: Buffer
  scopes: string[]
  expiresAt: number
}): void {
  getDb()
    .prepare(
      `INSERT INTO mod_account_tokens (id, twitch_user_id, twitch_login, access_token_enc, refresh_token_enc, scopes, expires_at, updated_at)
       VALUES (1, @twitchUserId, @twitchLogin, @accessTokenEnc, @refreshTokenEnc, @scopes, @expiresAt, @now)
       ON CONFLICT (id) DO UPDATE SET
         twitch_user_id = @twitchUserId,
         twitch_login = @twitchLogin,
         access_token_enc = @accessTokenEnc,
         refresh_token_enc = @refreshTokenEnc,
         scopes = @scopes,
         expires_at = @expiresAt,
         updated_at = @now`
    )
    .run({
      twitchUserId: data.twitchUserId,
      twitchLogin: data.twitchLogin,
      accessTokenEnc: data.accessTokenEnc,
      refreshTokenEnc: data.refreshTokenEnc,
      scopes: JSON.stringify(data.scopes),
      expiresAt: data.expiresAt,
      now: Date.now()
    })
}

export function clearModAuthToken(): void {
  getDb().prepare('DELETE FROM mod_account_tokens WHERE id = 1').run()
}
