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
import { getAdSchedule, normalizeAdSchedule } from '../twitch/helix/adSchedule.api'
import { getUserIdByLogin } from '../twitch/helix/users.api'
import { getSetting } from '../db/repositories/appSettings.repo'
import { getAuthStatus } from '../twitch/oauth/authStatus'
import { logger } from '../logger'

function hasAdScheduleScope(): boolean {
  return getAuthStatus().grantedScopes.includes('channel:read:ads')
}

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
    if (!hasAdScheduleScope()) {
      return { nextAdAt: null, lastAdAt: null, durationSeconds: null, scopeMissing: true }
    }
    try {
      const broadcasterId = await getUserIdByLogin(targetChannel)
      if (!broadcasterId) return null
      const schedule = normalizeAdSchedule(await getAdSchedule(broadcasterId))
      if (!schedule) return null
      return {
        nextAdAt: schedule.nextAdAt,
        lastAdAt: schedule.lastAdAt,
        durationSeconds: schedule.durationSeconds,
        scopeMissing: false
      }
    } catch (error) {
      logger.error('Ad-Schedule-Status-Abruf fehlgeschlagen', error)
      return null
    }
  })
}
