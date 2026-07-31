import type { useAuthStore } from '@renderer/stores/auth.store'
import type { useChatStore } from '@renderer/stores/chat.store'
import type { useAppInfoStore } from '@renderer/stores/appInfo.store'
import type { FeatureKey } from '@shared/types/auth'

type AuthStore = ReturnType<typeof useAuthStore>
type ChatStore = ReturnType<typeof useChatStore>
type AppInfoStore = ReturnType<typeof useAppInfoStore>

export async function initSettings(
  authStore: AuthStore,
  chatStore: ChatStore,
  appInfoStore: AppInfoStore
): Promise<() => void> {
  await Promise.all([
    authStore.fetchStatus(),
    authStore.fetchFeatures(),
    authStore.fetchClientId(),
    chatStore.fetchStatus(),
    chatStore.fetchTargetChannel(),
    chatStore.fetchAutoConnect(),
    appInfoStore.fetchVersion(),
    appInfoStore.fetchMetadata(),
    appInfoStore.fetchChangelog()
  ])
  const unsubscribeAuth = authStore.subscribeToStatusChanges()
  const unsubscribeDeviceAuth = authStore.subscribeToDeviceAuthPrompt()
  const unsubscribeChat = chatStore.subscribeToStatusChanges()
  const unsubscribeUpdateStatus = appInfoStore.subscribeToUpdateStatus()
  return () => {
    unsubscribeAuth()
    unsubscribeDeviceAuth()
    unsubscribeChat()
    unsubscribeUpdateStatus()
  }
}

export async function onToggleFeature(
  store: AuthStore,
  featureKey: FeatureKey,
  enabled: boolean
): Promise<void> {
  await store.setFeatureEnabled(featureKey, enabled)
}
