import {
  getRewardByTwitchId,
  getUniqueRewardByTitle,
  logRedemption,
  setRewardTwitchSync,
  updateRedemptionLogStatus
} from '../../../db/repositories/channelPoints.repo'
import type { ChannelPointReward, RedemptionStatus } from '@shared/types/channelPointReward'
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
  status?: string
  redeemed_at: string
}

interface RedemptionUpdateEvent extends RedemptionAddEvent {
  status: string
}

interface AutomaticRedemptionAddEvent {
  id: string
  user_login: string
  user_name?: string
  user_input?: string
  message?: { text?: string }
  reward: { type: string; channel_points?: number; cost?: number }
  redeemed_at: string
}

function resolveLocalReward(redemption: RedemptionAddEvent): ChannelPointReward | null {
  let localReward = getRewardByTwitchId(redemption.reward.id)

  if (!localReward && redemption.reward.title) {
    localReward = getUniqueRewardByTitle(redemption.reward.title)
    if (localReward && localReward.twitchRewardId !== redemption.reward.id) {
      setRewardTwitchSync(localReward.id, redemption.reward.id, Date.now())
      logger.info(
        `Reward "${localReward.title}" per Titel-Fallback mit Twitch-ID "${redemption.reward.id}" verknuepft`
      )
    }
  }

  return localReward
}

function mapRedemptionStatus(status: string): RedemptionStatus | null {
  const normalized = status.toLowerCase()
  if (normalized === 'fulfilled') return 'fulfilled'
  if (normalized === 'unfulfilled') return 'unfulfilled'
  if (normalized === 'canceled' || normalized === 'cancelled') return 'canceled'
  return null
}

function recordCustomRedemptionActivity(
  redemption: RedemptionAddEvent,
  localReward: ChannelPointReward | null,
  action: 'add' | 'update',
  status?: RedemptionStatus
): void {
  const rewardTitle = redemption.reward.title ?? localReward?.title ?? 'Custom Reward'

  recordActivityEvent({
    eventType: 'channel_points',
    twitchEventId: action === 'add' ? redemption.id : `${redemption.id}:${status ?? 'updated'}`,
    actorLogin: redemption.user_login,
    actorDisplayName: redemption.user_name ?? redemption.user_login,
    summary:
      action === 'add'
        ? `${redemption.user_login} loest ${rewardTitle} ein`
        : `${redemption.user_login} hat ${rewardTitle} jetzt ${status}`,
    payload: {
      rewardId: redemption.reward.id,
      rewardTitle,
      cost: redemption.reward.cost ?? localReward?.cost ?? null,
      status: status ?? null,
      userInput: redemption.user_input || null
    },
    occurredAt: Date.parse(redemption.redeemed_at)
  })
}

/** Verarbeitet eine `channel.channel_points_custom_reward_redemption.add`-Notification. */
export async function handleRedemptionAddEvent(
  event: Record<string, unknown>,
  broadcasterId: string
): Promise<void> {
  const redemption = event as unknown as RedemptionAddEvent
  const localReward = resolveLocalReward(redemption)
  recordCustomRedemptionActivity(redemption, localReward, 'add')

  if (!localReward) {
    logger.warn(`Redemption fuer unbekannten Reward "${redemption.reward.id}" ignoriert`)
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
    status: mapRedemptionStatus(redemption.status ?? '') ?? 'unfulfilled',
    redeemedAt: Date.parse(redemption.redeemed_at)
  })

  await runRedemptionAction(localReward, redemption.user_login)

  if (localReward.autoFulfill && logEntry.status !== 'fulfilled') {
    try {
      await updateRedemptionStatus(broadcasterId, redemption.reward.id, redemption.id, 'FULFILLED')
      logEntry.status = 'fulfilled'
      updateRedemptionLogStatus(redemption.id, 'fulfilled')
    } catch (error) {
      logger.error('Konnte Redemption nicht als fulfilled markieren', error)
    }
  }

  getMainWindow()?.webContents.send(IpcChannels.channelPoints.onRedemption, logEntry)
}

/** Verarbeitet Statuswechsel von Custom-Reward-Redemptions aus Twitch. */
export function handleRedemptionUpdateEvent(event: Record<string, unknown>): void {
  const redemption = event as unknown as RedemptionUpdateEvent
  const status = mapRedemptionStatus(redemption.status)

  if (!status) {
    logger.warn(`Unbekannter Redemption-Status "${redemption.status}" ignoriert`)
    return
  }

  const localReward = resolveLocalReward(redemption)
  recordCustomRedemptionActivity(redemption, localReward, 'update', status)

  const updatedEntry = updateRedemptionLogStatus(redemption.id, status)
  if (updatedEntry) {
    getMainWindow()?.webContents.send(IpcChannels.channelPoints.onRedemption, updatedEntry)
    return
  }

  if (!localReward) {
    logger.warn(`Status-Update fuer unbekannte Redemption "${redemption.id}" ignoriert`)
    return
  }

  const logEntry = logRedemption({
    rewardId: localReward.id,
    twitchRedemptionId: redemption.id,
    userLogin: redemption.user_login,
    userInput: redemption.user_input || null,
    status,
    redeemedAt: Date.parse(redemption.redeemed_at)
  })

  getMainWindow()?.webContents.send(IpcChannels.channelPoints.onRedemption, logEntry)
}

/** Verarbeitet automatische Channel-Points-Rewards fuer den Aktivitaetenfeed. */
export function handleAutomaticRedemptionAddEvent(event: Record<string, unknown>): void {
  const redemption = event as unknown as AutomaticRedemptionAddEvent
  const rewardTitle = redemption.reward.type.replace(/_/g, ' ')

  recordActivityEvent({
    eventType: 'channel_points',
    twitchEventId: redemption.id,
    actorLogin: redemption.user_login,
    actorDisplayName: redemption.user_name ?? redemption.user_login,
    summary: `${redemption.user_login} loest ${rewardTitle} ein`,
    payload: {
      rewardType: redemption.reward.type,
      rewardTitle,
      cost: redemption.reward.channel_points ?? redemption.reward.cost ?? null,
      userInput: redemption.user_input ?? redemption.message?.text ?? null
    },
    occurredAt: Date.parse(redemption.redeemed_at)
  })
}
