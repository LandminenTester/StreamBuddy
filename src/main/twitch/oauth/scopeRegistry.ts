import type { FeatureKey } from '@shared/types/auth'
import { listFeatureScopes, upsertFeatureScope } from '../../db/repositories/authTokens.repo'

/**
 * Zuordnung Feature -> benötigte Twitch-Scopes. `core_chat` deckt die
 * Basis-Chat-Funktionalität ab und ist immer aktiv (kein Toggle in der UI).
 */
export const FEATURE_SCOPE_MAP: Record<FeatureKey, string[]> = {
  core_chat: [
    'chat:read',
    'chat:edit',
    'user:read:chat',
    'user:write:chat',
    'user:manage:whispers'
  ],
  channel_points: ['channel:read:redemptions', 'channel:manage:redemptions'],
  polls: ['channel:read:polls', 'channel:manage:polls'],
  loyalty_follow_sub: ['moderator:read:followers', 'channel:read:subscriptions'],
  ad_schedule: ['channel:read:ads'],
  activity_feed: [
    'moderator:read:followers',
    'channel:read:subscriptions',
    'bits:read',
    'channel:read:redemptions'
  ],
  stream_info: ['channel:manage:broadcast'],
  shoutout: ['moderator:manage:shoutouts']
}

const OPTIONAL_FEATURES: FeatureKey[] = [
  'channel_points',
  'polls',
  'loyalty_follow_sub',
  'ad_schedule',
  'activity_feed',
  'stream_info',
  'shoutout'
]

/** Synchronisiert die Feature->Scope-Zuordnung in `feature_scopes`, ohne bestehende enabled-Flags zu überschreiben. */
export function syncFeatureScopes(): void {
  for (const [featureKey, scopes] of Object.entries(FEATURE_SCOPE_MAP) as [
    FeatureKey,
    string[]
  ][]) {
    upsertFeatureScope(featureKey, scopes, featureKey === 'core_chat')
  }
}

/** Liefert die konfigurierbaren (nicht immer-aktiven) Features für die Settings-UI. */
export function listOptionalFeatures(): FeatureKey[] {
  return OPTIONAL_FEATURES
}

/** Vereinigungsmenge aller Scopes über alle aktuell aktivierten Features. */
export function getRequiredScopesForEnabledFeatures(): string[] {
  const scopes = new Set<string>()
  for (const feature of listFeatureScopes()) {
    if (feature.enabled) {
      feature.requiredScopes.forEach((scope) => scopes.add(scope))
    }
  }
  return [...scopes]
}

/** Scopes, die für mind. ein aktiviertes Feature benötigt, aber (noch) nicht gewährt wurden. */
export function getMissingScopes(grantedScopes: string[]): string[] {
  const granted = new Set(grantedScopes)
  return getRequiredScopesForEnabledFeatures().filter((scope) => !granted.has(scope))
}
