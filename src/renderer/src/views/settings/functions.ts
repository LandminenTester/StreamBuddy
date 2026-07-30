import type { useAuthStore } from '@renderer/stores/auth.store'
import type { useChatStore } from '@renderer/stores/chat.store'
import type { FeatureKey } from '@shared/types/auth'

type AuthStore = ReturnType<typeof useAuthStore>
type ChatStore = ReturnType<typeof useChatStore>

export async function initSettings(
  authStore: AuthStore,
  chatStore: ChatStore
): Promise<() => void> {
  await Promise.all([
    authStore.fetchStatus(),
    authStore.fetchFeatures(),
    authStore.fetchClientId(),
    chatStore.fetchStatus(),
    chatStore.fetchTargetChannel()
  ])
  const unsubscribeAuth = authStore.subscribeToStatusChanges()
  const unsubscribeDeviceAuth = authStore.subscribeToDeviceAuthPrompt()
  const unsubscribeChat = chatStore.subscribeToStatusChanges()
  return () => {
    unsubscribeAuth()
    unsubscribeDeviceAuth()
    unsubscribeChat()
  }
}

export async function onToggleFeature(
  store: AuthStore,
  featureKey: FeatureKey,
  enabled: boolean
): Promise<void> {
  await store.setFeatureEnabled(featureKey, enabled)
}
