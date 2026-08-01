export type FeatureKey =
  'core_chat' | 'channel_points' | 'polls' | 'loyalty_follow_sub' | 'ad_schedule'

export interface FeatureScopeDefinition {
  featureKey: FeatureKey
  requiredScopes: string[]
  enabled: boolean
}

export interface AuthStatus {
  connected: boolean
  twitchLogin: string | null
  grantedScopes: string[]
  /** Scopes, die für mind. ein aktiviertes Feature fehlen -> Reauth nötig. */
  missingScopes: string[]
}

/** Device-Code-Grant-Flow: Nutzer muss diesen Code auf der Verification-URL eingeben. */
export interface DeviceAuthPrompt {
  userCode: string
  verificationUri: string
  expiresInSeconds: number
}
