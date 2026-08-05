import { forceRefresh, getValidAccessToken } from './tokenRefresher'
import { forceModRefresh, getValidModAccessToken } from './modTokenRefresher'

export interface ResolvedActor {
  accessToken: string
  /** Twitch-User-ID des sendenden Accounts. */
  userId: string
  refresh: () => Promise<{ accessToken: string } | null>
}

/**
 * Waehlt den Account, der eine moderator-gebundene Helix-Aktion ausfuehrt (Shoutout,
 * Ban/Timeout, ...): bevorzugt den Mod-Account, sonst den Broadcaster. Twitch verlangt,
 * dass die Token-User-ID exakt der `moderator_id` entspricht -- ein Account ohne den
 * noetigen Scope ist daher unbrauchbar und wird uebersprungen.
 */
export async function resolvePreferredActor(requiredScope: string): Promise<ResolvedActor | null> {
  const modTokens = await getValidModAccessToken()
  if (modTokens && modTokens.scopes.includes(requiredScope)) {
    return {
      accessToken: modTokens.accessToken,
      userId: modTokens.twitchUserId,
      refresh: async () => forceModRefresh()
    }
  }

  const tokens = await getValidAccessToken()
  if (tokens.scopes.includes(requiredScope)) {
    return {
      accessToken: tokens.accessToken,
      userId: tokens.twitchUserId,
      refresh: async () => forceRefresh()
    }
  }

  return null
}
