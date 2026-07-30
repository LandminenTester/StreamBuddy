import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { runOAuthFlow } from '../twitch/oauth/oauthFlow'
import {
  broadcastAuthStatus,
  disconnectBotAccount,
  getAuthStatus,
  listConfigurableFeatures,
  toggleFeature
} from '../twitch/oauth/authStatus'
import { connectChatClient, disconnectChatClient } from '../twitch/chat/tmiClient'
import { syncEventSubConnection, stopEventSub } from '../twitch/eventsub/eventSubClient'
import { logger } from '../logger'

export function registerAuthIpc(): void {
  handleTyped(IpcChannels.auth.getStatus, () => getAuthStatus())

  handleTyped(IpcChannels.auth.listFeatures, () => listConfigurableFeatures())

  handleTyped(IpcChannels.auth.setFeatureEnabled, async ({ featureKey, enabled }) => {
    const status = toggleFeature(featureKey, enabled)
    await syncEventSubConnection()
    broadcastAuthStatus()
    return status
  })

  handleTyped(IpcChannels.auth.startOAuth, async () => {
    try {
      await runOAuthFlow()
      await connectChatClient()
      await syncEventSubConnection()
    } catch (error) {
      logger.error('Twitch-OAuth-Flow fehlgeschlagen', error)
    }
    const status = getAuthStatus()
    broadcastAuthStatus()
    return status
  })

  handleTyped(IpcChannels.auth.disconnect, async () => {
    await disconnectChatClient()
    stopEventSub()
    disconnectBotAccount()
    broadcastAuthStatus()
  })
}
