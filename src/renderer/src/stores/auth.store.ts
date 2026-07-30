import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AuthStatus, FeatureKey, FeatureScopeDefinition } from '@shared/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>({
    connected: false,
    twitchLogin: null,
    grantedScopes: [],
    missingScopes: []
  })
  const features = ref<FeatureScopeDefinition[]>([])
  const isConnecting = ref(false)

  async function fetchStatus(): Promise<void> {
    status.value = await window.api.invoke('auth:getStatus', undefined)
  }

  async function fetchFeatures(): Promise<void> {
    features.value = await window.api.invoke('auth:listFeatures', undefined)
  }

  async function connect(): Promise<void> {
    isConnecting.value = true
    try {
      status.value = await window.api.invoke('auth:startOAuth', undefined)
    } finally {
      isConnecting.value = false
    }
  }

  async function disconnect(): Promise<void> {
    await window.api.invoke('auth:disconnect', undefined)
    await fetchStatus()
  }

  async function setFeatureEnabled(featureKey: FeatureKey, enabled: boolean): Promise<void> {
    status.value = await window.api.invoke('auth:setFeatureEnabled', { featureKey, enabled })
    await fetchFeatures()
  }

  function subscribeToStatusChanges(): () => void {
    return window.api.on('auth:onStatusChanged', (payload) => {
      status.value = payload
    })
  }

  return {
    status,
    features,
    isConnecting,
    fetchStatus,
    fetchFeatures,
    connect,
    disconnect,
    setFeatureEnabled,
    subscribeToStatusChanges
  }
})
