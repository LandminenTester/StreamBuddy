import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { runOAuthFlow, runModOAuthFlow } from '../twitch/oauth/oauthFlow'
import {
  broadcastAuthStatus,
  disconnectBotAccount,
  disconnectModAccount,
  getAuthStatus,
  listConfigurableFeatures,
  toggleFeature
} from '../twitch/oauth/authStatus'
import {
  connectChatClient,
  disconnectChatClient,
  getChatStatus
} from '../twitch/chat/tmiClient'
import { connectModChatClient, disconnectModChatClient } from '../twitch/chat/modTmiClient'
import { syncEventSubConnection, stopEventSub } from '../twitch/eventsub/eventSubClient'
import { getTwitchClientId, setTwitchClientId } from '../twitch/oauth/clientId'
import { getSetting } from '../db/repositories/appSettings.repo'
import { getMainWindow } from '../window'
import { logger } from '../logger'

export function registerAuthIpc(): void {
  handleTyped(IpcChannels.auth.getStatus, () => getAuthStatus())

  handleTyped(IpcChannels.auth.getClientId, () => getTwitchClientId())

  handleTyped(IpcChannels.auth.setClientId, ({ clientId }) => {
    setTwitchClientId(clientId)
  })

  handleTyped(IpcChannels.auth.listFeatures, () => listConfigurableFeatures())

  handleTyped(IpcChannels.auth.setFeatureEnabled, async ({ featureKey, enabled }) => {
    const status = toggleFeature(featureKey, enabled)
    await syncEventSubConnection()
    broadcastAuthStatus()
    return status
  })

  handleTyped(IpcChannels.auth.startOAuth, async () => {
    try {
      await runOAuthFlow((prompt) => {
        getMainWindow()?.webContents.send(IpcChannels.auth.onDeviceCodeReady, prompt)
      })
      await connectChatClient({ manual: true })
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

  handleTyped(IpcChannels.auth.startModOAuth, async () => {
    try {
      await runModOAuthFlow((prompt) => {
        getMainWindow()?.webContents.send(IpcChannels.auth.onModDeviceCodeReady, prompt)
      })
      // Mod-Client direkt verbinden, falls Broadcaster bereits verbunden und Channel gesetzt
      const chatStatus = getChatStatus()
      const targetChannel = getSetting('target_channel')
      if (chatStatus.connected && targetChannel) {
        await connectModChatClient(targetChannel)
      }
    } catch (error) {
      logger.error('Twitch-Mod-OAuth-Flow fehlgeschlagen', error)
    }
    const status = getAuthStatus()
    broadcastAuthStatus()
    return status
  })

  handleTyped(IpcChannels.auth.disconnectMod, async () => {
    await disconnectModChatClient()
    disconnectModAccount()
    broadcastAuthStatus()
  })
}
