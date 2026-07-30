import type { AuthStatus, FeatureKey, FeatureScopeDefinition } from '@shared/types/auth'
import { listFeatureScopes, setFeatureEnabled } from '../../db/repositories/authTokens.repo'
import { readTokens, clearTokens } from './tokenStore'
import { getMissingScopes, listOptionalFeatures } from './scopeRegistry'
import { getMainWindow } from '../../window'
import { IpcChannels } from '@shared/ipc/channels'

/** Berechnet den aktuellen Verbindungs- und Scope-Status für die Settings-UI. */
export function getAuthStatus(): AuthStatus {
  const tokens = readTokens()

  return {
    connected: tokens !== null,
    twitchLogin: tokens?.twitchLogin ?? null,
    grantedScopes: tokens?.scopes ?? [],
    missingScopes: getMissingScopes(tokens?.scopes ?? [])
  }
}

/** Nur die für die UI konfigurierbaren (optionalen) Features, mit required_scopes/enabled. */
export function listConfigurableFeatures(): FeatureScopeDefinition[] {
  const optional = new Set<string>(listOptionalFeatures())
  return listFeatureScopes()
    .filter((f) => optional.has(f.featureKey))
    .map((f) => ({ ...f, featureKey: f.featureKey as FeatureKey }))
}

export function toggleFeature(featureKey: FeatureKey, enabled: boolean): AuthStatus {
  setFeatureEnabled(featureKey, enabled)
  return getAuthStatus()
}

export function disconnectBotAccount(): void {
  clearTokens()
}

/** Sendet den aktuellen Auth-Status per Push an das Hauptfenster (z.B. nach OAuth/Reauth). */
export function broadcastAuthStatus(): void {
  const window = getMainWindow()
  if (!window) return
  window.webContents.send(IpcChannels.auth.onStatusChanged, getAuthStatus())
}
