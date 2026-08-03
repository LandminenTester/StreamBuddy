import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { getSetting, setSetting } from '../db/repositories/appSettings.repo'
import {
  connectChatClient,
  getChatStatus,
  isAutoConnectEnabled,
  moderateChatUser,
  setAutoConnectEnabled
} from '../twitch/chat/tmiClient'
import { syncEventSubConnection } from '../twitch/eventsub/eventSubClient'

export function registerChatIpc(): void {
  handleTyped(IpcChannels.chat.getStatus, () => getChatStatus())

  handleTyped(IpcChannels.chat.getTargetChannel, () => getSetting('target_channel'))

  handleTyped(IpcChannels.chat.setTargetChannel, async ({ channel }) => {
    setSetting('target_channel', channel.trim().toLowerCase())
    await connectChatClient({ manual: true })
    await syncEventSubConnection()
    return getChatStatus()
  })

  handleTyped(IpcChannels.chat.getAutoConnect, () => isAutoConnectEnabled())

  handleTyped(IpcChannels.chat.setAutoConnect, ({ enabled }) => {
    setAutoConnectEnabled(enabled)
    return isAutoConnectEnabled()
  })

  handleTyped(IpcChannels.chat.connect, async () => {
    await connectChatClient({ manual: true })
    return getChatStatus()
  })

  handleTyped(IpcChannels.chat.moderate, async ({ action, targetLogin, durationSeconds }) => {
    await moderateChatUser(action, targetLogin, durationSeconds)
  })
}
