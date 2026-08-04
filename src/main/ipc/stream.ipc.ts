import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { getSetting } from '../db/repositories/appSettings.repo'
import { listFeatureScopes } from '../db/repositories/authTokens.repo'
import { getUserIdByLogin } from '../twitch/helix/users.api'
import { patchChannelInformation, searchCategories } from '../twitch/helix/channels.api'
import { getAutoShoutoutEnabled, setAutoShoutoutEnabled } from '../twitch/shoutouts/autoShoutout'
import { syncEventSubConnection } from '../twitch/eventsub/eventSubClient'
import { logger } from '../logger'

function isStreamInfoFeatureEnabled(): boolean {
  return listFeatureScopes().some((feature) => feature.featureKey === 'stream_info' && feature.enabled)
}

export function registerStreamIpc(): void {
  handleTyped(IpcChannels.stream.updateInfo, async ({ title, gameName }) => {
    if (!isStreamInfoFeatureEnabled()) {
      throw new Error('Feature "Stream-Titel & Kategorie bearbeiten" ist nicht aktiviert.')
    }

    const targetChannel = getSetting('target_channel')
    if (!targetChannel) throw new Error('Kein Zielkanal konfiguriert.')

    const broadcasterId = await getUserIdByLogin(targetChannel)
    if (!broadcasterId) throw new Error('Kanal-ID konnte nicht ermittelt werden.')

    let gameId: string | undefined
    if (gameName && gameName.trim()) {
      const matches = await searchCategories(gameName.trim())
      const exact = matches.find((m) => m.name.toLowerCase() === gameName.trim().toLowerCase())
      gameId = (exact ?? matches[0])?.id
      if (!gameId) throw new Error(`Spiel "${gameName}" wurde bei Twitch nicht gefunden.`)
    }

    try {
      await patchChannelInformation(broadcasterId, { title, gameId })
      return { success: true }
    } catch (error) {
      logger.error('Stream-Info-Update fehlgeschlagen', error)
      throw error
    }
  })

  handleTyped(IpcChannels.shoutout.getEnabled, () => getAutoShoutoutEnabled())

  handleTyped(IpcChannels.shoutout.setEnabled, async ({ enabled }) => {
    setAutoShoutoutEnabled(enabled)
    // Die Raid-Subscription haengt an dieser Einstellung -- EventSub muss nachziehen.
    await syncEventSubConnection()
    return getAutoShoutoutEnabled()
  })
}
