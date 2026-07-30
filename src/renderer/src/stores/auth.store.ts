import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  AuthStatus,
  DeviceAuthPrompt,
  FeatureKey,
  FeatureScopeDefinition
} from '@shared/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>({
    connected: false,
    twitchLogin: null,
    grantedScopes: [],
    missingScopes: []
  })
  const features = ref<FeatureScopeDefinition[]>([])
  const isConnecting = ref(false)
  const deviceAuthPrompt = ref<DeviceAuthPrompt | null>(null)
  const clientId = ref('')
  const isSavingClientId = ref(false)

  async function fetchStatus(): Promise<void> {
    status.value = await window.api.invoke('auth:getStatus', undefined)
  }

  async function fetchFeatures(): Promise<void> {
    features.value = await window.api.invoke('auth:listFeatures', undefined)
  }

  async function fetchClientId(): Promise<void> {
    clientId.value = (await window.api.invoke('auth:getClientId', undefined)) ?? ''
  }

  async function saveClientId(value: string): Promise<void> {
    isSavingClientId.value = true
    try {
      await window.api.invoke('auth:setClientId', { clientId: value })
      clientId.value = value
    } finally {
      isSavingClientId.value = false
    }
  }

  async function connect(): Promise<void> {
    isConnecting.value = true
    deviceAuthPrompt.value = null
    try {
      status.value = await window.api.invoke('auth:startOAuth', undefined)
    } finally {
      isConnecting.value = false
      deviceAuthPrompt.value = null
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

  function subscribeToDeviceAuthPrompt(): () => void {
    return window.api.on('auth:onDeviceCodeReady', (prompt) => {
      deviceAuthPrompt.value = prompt
    })
  }

  return {
    status,
    features,
    isConnecting,
    deviceAuthPrompt,
    clientId,
    isSavingClientId,
    fetchStatus,
    fetchFeatures,
    fetchClientId,
    saveClientId,
    connect,
    disconnect,
    setFeatureEnabled,
    subscribeToStatusChanges,
    subscribeToDeviceAuthPrompt
  }
})
