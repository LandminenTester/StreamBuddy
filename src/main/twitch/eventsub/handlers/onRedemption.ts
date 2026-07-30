import { getRewardByTwitchId, logRedemption } from '../../../db/repositories/channelPoints.repo'
import { updateRedemptionStatus } from '../../helix/channelPoints.api'
import { runRedemptionAction } from '../../redemptionActions'
import { getMainWindow } from '../../../window'
import { IpcChannels } from '@shared/ipc/channels'
import { logger } from '../../../logger'

interface RedemptionAddEvent {
  id: string
  user_login: string
  user_input: string
  reward: { id: string }
  redeemed_at: string
}

/** Verarbeitet eine `channel.channel_points_custom_reward_redemption.add`-Notification. */
export async function handleRedemptionAddEvent(
  event: Record<string, unknown>,
  broadcasterId: string
): Promise<void> {
  const redemption = event as unknown as RedemptionAddEvent
  const localReward = getRewardByTwitchId(redemption.reward.id)

  if (!localReward) {
    logger.warn(`Redemption für unbekannten Reward "${redemption.reward.id}" ignoriert`)
    return
  }

  const logEntry = logRedemption({
    rewardId: localReward.id,
    twitchRedemptionId: redemption.id,
    userLogin: redemption.user_login,
    userInput: redemption.user_input || null,
    status: 'unfulfilled',
    redeemedAt: Date.parse(redemption.redeemed_at)
  })

  await runRedemptionAction(localReward)

  if (localReward.autoFulfill) {
    try {
      await updateRedemptionStatus(broadcasterId, redemption.reward.id, redemption.id, 'FULFILLED')
      logEntry.status = 'fulfilled'
    } catch (error) {
      logger.error('Konnte Redemption nicht als fulfilled markieren', error)
    }
  }

  getMainWindow()?.webContents.send(IpcChannels.channelPoints.onRedemption, logEntry)
}
