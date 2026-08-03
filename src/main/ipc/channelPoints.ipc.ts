import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  createReward,
  deleteReward,
  getRewardById,
  listRecentRedemptions,
  listRewards,
  setRewardTwitchSync,
  updateReward
} from '../db/repositories/channelPoints.repo'
import {
  createTwitchReward,
  deleteTwitchReward,
  updateTwitchReward
} from '../twitch/helix/channelPoints.api'
import { getUserIdByLogin } from '../twitch/helix/users.api'
import { getSetting } from '../db/repositories/appSettings.repo'
import { logger } from '../logger'

async function resolveBroadcasterId(): Promise<string | null> {
  const targetChannel = getSetting('target_channel')
  if (!targetChannel) return null
  return getUserIdByLogin(targetChannel)
}

export function registerChannelPointsIpc(): void {
  handleTyped(IpcChannels.channelPoints.list, () => listRewards())

  handleTyped(IpcChannels.channelPoints.listRedemptions, () => listRecentRedemptions())

  handleTyped(IpcChannels.channelPoints.create, async (input) => {
    const created = createReward(input)

    const broadcasterId = await resolveBroadcasterId()
    if (!broadcasterId) return created

    try {
      const twitchReward = await createTwitchReward(broadcasterId, {
        title: created.title,
        cost: created.cost,
        prompt: created.prompt,
        backgroundColor: created.backgroundColor,
        autoFulfill: created.autoFulfill
      })
      setRewardTwitchSync(created.id, twitchReward.id, Date.now())
      return getRewardById(created.id)
    } catch (error) {
      // Nicht verschlucken: ohne twitchRewardId würden Redemptions dieser Belohnung
      // später von handleRedemptionAddEvent unauffindbar sein (nur ein logger.warn,
      // Aktion feuert nie). Lieber die DB-Zeile zurücknehmen und den Fehler an die UI
      // durchreichen, damit der Nutzer den Reward erneut anlegt statt scheinbar
      // funktionsfähig im nicht-synchronisierten Zustand zu belassen.
      deleteReward(created.id)
      logger.error('Twitch-Reward-Sync bei create fehlgeschlagen', error)
      throw new Error(
        `Reward konnte nicht mit Twitch synchronisiert werden: ${(error as Error).message}`
      )
    }
  })

  handleTyped(IpcChannels.channelPoints.update, async ({ id, patch }) => {
    const updated = updateReward(id, patch)

    const broadcasterId = await resolveBroadcasterId()
    if (broadcasterId && updated.twitchRewardId) {
      try {
        await updateTwitchReward(broadcasterId, updated.twitchRewardId, {
          title: updated.title,
          cost: updated.cost,
          prompt: updated.prompt,
          isEnabled: updated.isEnabled,
          backgroundColor: updated.backgroundColor,
          autoFulfill: updated.autoFulfill
        })
      } catch (error) {
        logger.error('Twitch-Reward-Sync bei update fehlgeschlagen', error)
      }
    }

    return updated
  })

  handleTyped(IpcChannels.channelPoints.delete, async ({ id }) => {
    const reward = getRewardById(id)
    const broadcasterId = await resolveBroadcasterId()

    if (broadcasterId && reward.twitchRewardId) {
      try {
        await deleteTwitchReward(broadcasterId, reward.twitchRewardId)
      } catch (error) {
        logger.error('Twitch-Reward-Löschung fehlgeschlagen', error)
      }
    }

    deleteReward(id)
  })
}
