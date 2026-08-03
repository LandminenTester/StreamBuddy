import {
  getRewardByTwitchId,
  getUniqueRewardByTitle,
  logRedemption,
  setRewardTwitchSync
} from '../../../db/repositories/channelPoints.repo'
import { updateRedemptionStatus } from '../../helix/channelPoints.api'
import { runRedemptionAction } from '../../redemptionActions'
import { getMainWindow } from '../../../window'
import { IpcChannels } from '@shared/ipc/channels'
import { logger } from '../../../logger'
import { recordActivityEvent } from '../../../activity/activityService'

interface RedemptionAddEvent {
  id: string
  user_login: string
  user_name?: string
  user_input: string
  reward: { id: string; title?: string; cost?: number }
  redeemed_at: string
}

/** Verarbeitet eine `channel.channel_points_custom_reward_redemption.add`-Notification. */
export async function handleRedemptionAddEvent(
  event: Record<string, unknown>,
  broadcasterId: string
): Promise<void> {
  const redemption = event as unknown as RedemptionAddEvent
  let localReward = getRewardByTwitchId(redemption.reward.id)
  const rewardTitle = redemption.reward.title ?? localReward?.title ?? 'Custom Reward'

  recordActivityEvent({
    eventType: 'channel_points',
    twitchEventId: redemption.id,
    actorLogin: redemption.user_login,
    actorDisplayName: redemption.user_name ?? redemption.user_login,
    summary: `${redemption.user_login} loest ${rewardTitle} ein`,
    payload: {
      rewardId: redemption.reward.id,
      rewardTitle,
      cost: redemption.reward.cost ?? localReward?.cost ?? null,
      userInput: redemption.user_input || null
    },
    occurredAt: Date.parse(redemption.redeemed_at)
  })

  if (!localReward && redemption.reward.title) {
    localReward = getUniqueRewardByTitle(redemption.reward.title)
    if (localReward && localReward.twitchRewardId !== redemption.reward.id) {
      setRewardTwitchSync(localReward.id, redemption.reward.id, Date.now())
      logger.info(
        `Reward "${localReward.title}" per Titel-Fallback mit Twitch-ID "${redemption.reward.id}" verknuepft`
      )
    }
  }

  if (!localReward) {
    logger.warn(`Redemption für unbekannten Reward "${redemption.reward.id}" ignoriert`)
    return
  }

  logger.info(
    `Redemption "${localReward.title}" von ${redemption.user_login} empfangen (actionType=${localReward.actionType})`
  )

  const logEntry = logRedemption({
    rewardId: localReward.id,
    twitchRedemptionId: redemption.id,
    userLogin: redemption.user_login,
    userInput: redemption.user_input || null,
    status: 'unfulfilled',
    redeemedAt: Date.parse(redemption.redeemed_at)
  })

  await runRedemptionAction(localReward, redemption.user_login)

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
