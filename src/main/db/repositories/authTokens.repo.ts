import { getDb } from '../connection'

/**
 * Speichert nur bereits verschlüsselte Token-Buffer (Verschlüsselung via safeStorage
 * erfolgt in src/main/twitch/oauth/tokenStore.ts, Phase 2). Singleton-Row (id=1).
 */
export interface StoredAuthTokenRow {
  id: number
  twitch_user_id: string
  twitch_login: string
  access_token_enc: Buffer
  refresh_token_enc: Buffer
  scopes: string
  expires_at: number
  updated_at: number
}

export function getStoredAuthToken(): StoredAuthTokenRow | null {
  const row = getDb()
    .prepare<[], StoredAuthTokenRow>('SELECT * FROM auth_tokens WHERE id = 1')
    .get()
  return row ?? null
}

export function upsertAuthToken(data: {
  twitchUserId: string
  twitchLogin: string
  accessTokenEnc: Buffer
  refreshTokenEnc: Buffer
  scopes: string[]
  expiresAt: number
}): void {
  getDb()
    .prepare(
      `INSERT INTO auth_tokens (id, twitch_user_id, twitch_login, access_token_enc, refresh_token_enc, scopes, expires_at, updated_at)
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

export function clearAuthToken(): void {
  getDb().prepare('DELETE FROM auth_tokens WHERE id = 1').run()
}

export function listFeatureScopes(): {
  featureKey: string
  requiredScopes: string[]
  enabled: boolean
}[] {
  return getDb()
    .prepare<[], { feature_key: string; required_scopes: string; enabled: number }>(
      'SELECT * FROM feature_scopes'
    )
    .all()
    .map((row) => ({
      featureKey: row.feature_key,
      requiredScopes: JSON.parse(row.required_scopes) as string[],
      enabled: Boolean(row.enabled)
    }))
}

export function upsertFeatureScope(
  featureKey: string,
  requiredScopes: string[],
  defaultEnabled = false
): void {
  getDb()
    .prepare(
      `INSERT INTO feature_scopes (feature_key, required_scopes, enabled)
       VALUES (@featureKey, @requiredScopes, @defaultEnabled)
       ON CONFLICT (feature_key) DO UPDATE SET required_scopes = @requiredScopes`
    )
    .run({
      featureKey,
      requiredScopes: JSON.stringify(requiredScopes),
      defaultEnabled: defaultEnabled ? 1 : 0
    })
}

export function setFeatureEnabled(featureKey: string, enabled: boolean): void {
  getDb()
    .prepare('UPDATE feature_scopes SET enabled = ? WHERE feature_key = ?')
    .run(enabled ? 1 : 0, featureKey)
}
