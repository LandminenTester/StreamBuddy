import type { FeatureKey } from './types/auth'

/**
 * Features/Spiele, die Twitch-seitig aktuell nicht zuverlaessig nutzbar sind (z.B. weil
 * die noetige Extended-Access-Freigabe fuer den Scope aktuell nicht erteilt wird, oder
 * weil die Whisper-API fuer nicht verifizierte Bots eingeschraenkt ist). Bleiben im Code
 * vollstaendig erhalten, werden aber erzwungen deaktiviert und in der UI ausgegraut,
 * bis Twitch die jeweilige Schnittstelle wieder freigibt.
 */
export const UNAVAILABLE_FEATURE_KEYS: readonly FeatureKey[] = ['ad_schedule']

export const UNAVAILABLE_GAME_IDS: readonly string[] = ['ssp']

export function isFeatureTemporarilyUnavailable(featureKey: string): boolean {
  return UNAVAILABLE_FEATURE_KEYS.includes(featureKey as FeatureKey)
}

export function isGameTemporarilyUnavailable(gameId: string): boolean {
  return UNAVAILABLE_GAME_IDS.includes(gameId)
}
