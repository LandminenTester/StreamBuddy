import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  createAutomessage,
  deleteAutomessage,
  listAutomessages,
  updateAutomessage
} from '../db/repositories/automessages.repo'
import { restartAutomessageSchedulerIfConnected } from '../twitch/chat/tmiClient'
import { getAdMessageSettings, setAdMessageSettings } from '../twitch/ads/adMessageSettings'
import { getAdSchedule } from '../twitch/helix/adSchedule.api'
import { getUserIdByLogin } from '../twitch/helix/users.api'
import { getSetting } from '../db/repositories/appSettings.repo'
import { logger } from '../logger'

export function registerAutomessagesIpc(): void {
  handleTyped(IpcChannels.automessages.list, () => listAutomessages())

  handleTyped(IpcChannels.automessages.create, (input) => {
    const created = createAutomessage(input)
    restartAutomessageSchedulerIfConnected()
    return created
  })

  handleTyped(IpcChannels.automessages.update, ({ id, patch }) => {
    const updated = updateAutomessage(id, patch)
    restartAutomessageSchedulerIfConnected()
    return updated
  })

  handleTyped(IpcChannels.automessages.delete, ({ id }) => {
    deleteAutomessage(id)
    restartAutomessageSchedulerIfConnected()
  })

  handleTyped(IpcChannels.automessages.getAdMessageSettings, () => getAdMessageSettings())

  handleTyped(IpcChannels.automessages.setAdMessageSettings, (settings) => {
    setAdMessageSettings(settings)
  })

  handleTyped(IpcChannels.automessages.getAdScheduleStatus, async () => {
    const targetChannel = getSetting('target_channel')
    if (!targetChannel) return null
    try {
      const broadcasterId = await getUserIdByLogin(targetChannel)
      if (!broadcasterId) return null
      const schedule = await getAdSchedule(broadcasterId)
      if (!schedule) return null
      return {
        nextAdAt: schedule.next_ad_at || null,
        lastAdAt: schedule.last_ad_at || null,
        durationSeconds: schedule.duration ?? null
      }
    } catch (error) {
      logger.error('Ad-Schedule-Status-Abruf fehlgeschlagen', error)
      return null
    }
  })
}
