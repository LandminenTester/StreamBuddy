import type { AuthStatus, FeatureKey, FeatureScopeDefinition } from '@shared/types/auth'
import { listFeatureScopes, setFeatureEnabled } from '../../db/repositories/authTokens.repo'
import { readTokens, clearTokens } from './tokenStore'
import { readModTokens, clearModTokens } from './modTokenStore'
import { getMissingScopes, listOptionalFeatures } from './scopeRegistry'
import { getMainWindow } from '../../window'
import { IpcChannels } from '@shared/ipc/channels'
import { isFeatureTemporarilyUnavailable } from '@shared/temporarilyUnavailable'

/** Berechnet den aktuellen Verbindungs- und Scope-Status für die Settings-UI. */
export function getAuthStatus(): AuthStatus {
  const tokens = readTokens()
  const modTokens = readModTokens()

  return {
    connected: tokens !== null,
    twitchLogin: tokens?.twitchLogin ?? null,
    grantedScopes: tokens?.scopes ?? [],
    missingScopes: getMissingScopes(tokens?.scopes ?? []),
    modConnected: modTokens !== null,
    modTwitchLogin: modTokens?.twitchLogin ?? null
  }
}

/** Nur die für die UI konfigurierbaren (optionalen) Features, mit required_scopes/enabled. */
export function listConfigurableFeatures(): FeatureScopeDefinition[] {
  const optional = new Set<string>(listOptionalFeatures())
  return listFeatureScopes()
    .filter((f) => optional.has(f.featureKey))
    .map((f) => ({
      ...f,
      featureKey: f.featureKey as FeatureKey,
      enabled: isFeatureTemporarilyUnavailable(f.featureKey) ? false : f.enabled
    }))
}

export function toggleFeature(featureKey: FeatureKey, enabled: boolean): AuthStatus {
  if (isFeatureTemporarilyUnavailable(featureKey) && enabled) {
    throw new Error(
      'Dieses Feature ist aktuell wegen einer Twitch-API-Einschraenkung nicht verfuegbar.'
    )
  }
  setFeatureEnabled(featureKey, enabled)
  return getAuthStatus()
}

export function disconnectBotAccount(): void {
  clearTokens()
}

export function disconnectModAccount(): void {
  clearModTokens()
}

/** Sendet den aktuellen Auth-Status per Push an das Hauptfenster (z.B. nach OAuth/Reauth). */
export function broadcastAuthStatus(): void {
  const window = getMainWindow()
  if (!window) return
  window.webContents.send(IpcChannels.auth.onStatusChanged, getAuthStatus())
}
