import { getAdSchedule, normalizeAdSchedule } from '../helix/adSchedule.api'
import { getUserIdByLogin } from '../helix/users.api'
import { getSetting } from '../../db/repositories/appSettings.repo'
import { getAdMessageSettings, getLastSentFor, setLastSentFor } from './adMessageSettings'
import { sendChatMessage } from '../chat/tmiClient'
import { logger } from '../../logger'

const POLL_INTERVAL_MS = 60_000

let pollTimer: NodeJS.Timeout | null = null
let broadcasterId: string | null = null

function pickRandom(texts: string[]): string | null {
  if (texts.length === 0) return null
  return texts[Math.floor(Math.random() * texts.length)]
}

async function pollOnce(): Promise<void> {
  const settings = getAdMessageSettings()
  if (!settings.enabled) {
    scheduleNext()
    return
  }

  try {
    if (!broadcasterId) {
      const targetChannel = getSetting('target_channel')
      if (!targetChannel) {
        scheduleNext()
        return
      }
      broadcasterId = await getUserIdByLogin(targetChannel)
    }
    if (!broadcasterId) {
      scheduleNext()
      return
    }

    const schedule = normalizeAdSchedule(await getAdSchedule(broadcasterId))
    if (!schedule) {
      logger.info('Ad-Schedule: Kein Zeitplan von Twitch erhalten')
      scheduleNext()
      return
    }
    if (!schedule.nextAdAt) {
      scheduleNext()
      return
    }

    const secondsUntilAd = (new Date(schedule.nextAdAt).getTime() - Date.now()) / 1000
    const alreadySentForThisAd = getLastSentFor() === schedule.nextAdAt

    if (secondsUntilAd > 0 && secondsUntilAd <= settings.leadSeconds && !alreadySentForThisAd) {
      const message = pickRandom(settings.texts)
      if (message) {
        await sendChatMessage(message)
        setLastSentFor(schedule.nextAdAt)
      }
    }
  } catch (error) {
    // z.B. fehlender channel:read:ads-Scope, wenn kein Broadcaster-Account verbunden ist --
    // geloggt statt die App abstuerzen zu lassen, das Feature bleibt einfach wirkungslos.
    logger.error('Ad-Schedule-Poll fehlgeschlagen', error)
  }

  scheduleNext()
}

function scheduleNext(): void {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = setTimeout(() => void pollOnce(), POLL_INTERVAL_MS)
}

export function startAdSchedulePoller(): void {
  stopAdSchedulePoller()
  void pollOnce()
}

export function stopAdSchedulePoller(): void {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
  broadcasterId = null
}
