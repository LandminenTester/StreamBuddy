import type { ChannelPointReward } from '@shared/types/channelPointReward'
import type { Command } from '@shared/types/command'
import { sendChatMessage } from './chat/tmiClient'
import { getCommandById, incrementCommandUseCount } from '../db/repositories/commands.repo'
import { adjustTracker, getTrackerCurrentValue, listTrackers } from '../db/repositories/trackers.repo'
import {
  findTrackerByPlaceholderKey,
  formatTrackerCurrentValue,
  WERT_PLACEHOLDER_PATTERN
} from '@shared/utils/wertPlaceholders'
import { creditLoyalty } from '../loyalty/loyaltyLedger'
import { resolveTextPlaceholders } from '../loyalty/games/gameRegistry'
import { getSetting } from '../db/repositories/appSettings.repo'
import { getActiveChatClient } from './chat/chatClientAccessor'
import { logger } from '../logger'
import { sendWhisper } from './helix/whispers.api'

function resolveCommandResponse(
  response: string,
  oldValues: Record<number, string>,
  newValues: Record<number, string>
): string {
  let result = resolveTextPlaceholders(response)

  const firstOldValue = Object.values(oldValues)[0]
  const firstNewValue = Object.values(newValues)[0]
  if (firstOldValue !== undefined) result = result.replaceAll('{alter_wert}', firstOldValue)
  if (firstNewValue !== undefined) result = result.replaceAll('{neuer_wert}', firstNewValue)

  result = result.replace(/\{old:(\d+)\}/g, (_, rawId: string) => oldValues[Number(rawId)] ?? '')
  result = result.replace(/\{new:(\d+)\}/g, (_, rawId: string) => newValues[Number(rawId)] ?? '')

  const trackers = listTrackers()
  return result.replace(WERT_PLACEHOLDER_PATTERN, (_, rawKey: string) => {
    const tracker = findTrackerByPlaceholderKey(trackers, rawKey)
    return tracker ? formatTrackerCurrentValue(tracker) : ''
  })
}

async function sendRewardCommandResponse(
  command: Command,
  userLogin: string,
  resolvedResponse: string
): Promise<void> {
  const sender = getActiveChatClient()
  const channel = getSetting('target_channel')

  if (!sender || !channel) {
    logger.warn(`Redemption-Command "${command.trigger}" ausgefuehrt, aber Chat ist nicht verbunden`)
    return
  }

  if (command.deliveryMode === 'whisper') {
    await sendWhisper(userLogin, resolvedResponse)
    return
  }

  await sender.say(
    channel,
    command.deliveryMode === 'mention' ? `@${userLogin} ${resolvedResponse}` : resolvedResponse
  )
}

async function runCommandRewardAction(command: Command, userLogin: string): Promise<void> {
  if (!command.enabled) {
    logger.warn(`Redemption-Command "${command.trigger}" ist deaktiviert`)
    return
  }

  const oldValues: Record<number, string> = {}
  const newValues: Record<number, string> = {}
  const trackerActions = command.trackerActions.length
    ? command.trackerActions
    : command.trackerId && command.trackerAction
      ? [{ trackerId: command.trackerId, action: command.trackerAction }]
      : []

  for (const trackerAction of trackerActions) {
    oldValues[trackerAction.trackerId] = getTrackerCurrentValue(trackerAction.trackerId)
    adjustTracker(trackerAction.trackerId, trackerAction.action === 'increment' ? 1 : -1)
    newValues[trackerAction.trackerId] = getTrackerCurrentValue(trackerAction.trackerId)
  }

  const resolvedResponse = resolveCommandResponse(command.response, oldValues, newValues)
  await sendRewardCommandResponse(command, userLogin, resolvedResponse)
  incrementCommandUseCount(command.id)
}

/** Fuehrt die konfigurierte Aktion eines Custom Rewards nach einer Redemption aus. */
export async function runRedemptionAction(
  reward: ChannelPointReward,
  userLogin: string
): Promise<boolean> {
  if (reward.actionType === 'chat_message' && reward.actionPayload?.message) {
    await sendChatMessage(resolveTextPlaceholders(reward.actionPayload.message))
    logger.info(`Redemption-Aktion: Chatnachricht fuer Reward "${reward.title}" gesendet`)
    return true
  }

  if (reward.actionType === 'trigger_command' && reward.actionPayload?.commandId) {
    try {
      const command = getCommandById(reward.actionPayload.commandId)
      await runCommandRewardAction(command, userLogin)
      logger.info(`Redemption-Aktion: Command fuer Reward "${reward.title}" ausgeloest`)
      return true
    } catch (error) {
      logger.error(`Redemption-Aktion: Command nicht gefunden fuer Reward "${reward.title}"`, error)
      return false
    }
  }

  if (reward.actionType === 'loyalty_exchange') {
    const payload = reward.actionPayload
    const exchangeValue = Number(payload?.loyaltyExchangeValue)
    if (
      !payload?.loyaltyExchangeMode ||
      !Number.isFinite(exchangeValue) ||
      exchangeValue <= 0
    ) {
      logger.warn(
        `Redemption-Aktion: loyalty_exchange fuer Reward "${reward.title}" ohne gueltige payload`
      )
      return false
    }

    const points =
      payload.loyaltyExchangeMode === 'rate'
        ? Math.floor(reward.cost / exchangeValue)
        : Math.floor(exchangeValue)

    if (points <= 0) {
      logger.warn(`Redemption-Aktion: loyalty_exchange fuer Reward "${reward.title}" ergibt 0 Punkte`)
      return false
    }

    const transaction = creditLoyalty(userLogin, points, 'channel_point_exchange')
    if (!transaction) {
      logger.warn(
        `Redemption-Aktion: Loyalty-Punkte fuer "${userLogin}" uebersprungen, Konto ist geblacklistet`
      )
      return false
    }

    logger.info(
      `Redemption-Aktion: ${points} Loyalty-Punkte fuer "${userLogin}" via Reward "${reward.title}" gutgeschrieben`
    )
    return true
  }

  if (reward.actionType !== 'none') {
    logger.warn(
      `Redemption-Aktion fuer Reward "${reward.title}" uebersprungen: actionType=${reward.actionType}, aber keine gueltige actionPayload konfiguriert`
    )
    return false
  }

  return true
}
