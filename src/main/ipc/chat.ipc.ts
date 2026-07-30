import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { getSetting, setSetting } from '../db/repositories/appSettings.repo'
import { connectChatClient, getChatStatus } from '../twitch/chat/tmiClient'
import { syncEventSubConnection } from '../twitch/eventsub/eventSubClient'

export function registerChatIpc(): void {
  handleTyped(IpcChannels.chat.getStatus, () => getChatStatus())

  handleTyped(IpcChannels.chat.getTargetChannel, () => getSetting('target_channel'))

  handleTyped(IpcChannels.chat.setTargetChannel, async ({ channel }) => {
    setSetting('target_channel', channel.trim().toLowerCase())
    await connectChatClient()
    await syncEventSubConnection()
    return getChatStatus()
  })
}
