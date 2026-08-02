import type { ChannelPointReward } from '@shared/types/channelPointReward'
import { sendChatMessage } from './chat/tmiClient'
import { getCommandById } from '../db/repositories/commands.repo'
import { creditLoyalty } from '../loyalty/loyaltyLedger'
import { logger } from '../logger'

/** Führt die konfigurierte Aktion eines Custom Rewards nach einer Redemption aus. */
export async function runRedemptionAction(
  reward: ChannelPointReward,
  userLogin: string
): Promise<void> {
  if (reward.actionType === 'chat_message' && reward.actionPayload?.message) {
    await sendChatMessage(reward.actionPayload.message)
    logger.info(`Redemption-Aktion: Chatnachricht für Reward "${reward.title}" gesendet`)
    return
  }

  if (reward.actionType === 'trigger_command' && reward.actionPayload?.commandId) {
    try {
      const command = getCommandById(reward.actionPayload.commandId)
      await sendChatMessage(command.response)
      logger.info(`Redemption-Aktion: Command für Reward "${reward.title}" ausgelöst`)
    } catch (error) {
      logger.error(`Redemption-Aktion: Command nicht gefunden für Reward "${reward.title}"`, error)
    }
    return
  }

  if (reward.actionType === 'loyalty_exchange') {
    const payload = reward.actionPayload
    if (!payload?.loyaltyExchangeMode || !payload.loyaltyExchangeValue) {
      logger.warn(`Redemption-Aktion: loyalty_exchange für Reward "${reward.title}" ohne gültige payload`)
      return
    }

    const points =
      payload.loyaltyExchangeMode === 'rate'
        ? Math.floor(reward.cost / payload.loyaltyExchangeValue)
        : payload.loyaltyExchangeValue

    creditLoyalty(userLogin, points, 'channel_point_exchange')
    logger.info(
      `Redemption-Aktion: ${points} Loyalty-Punkte für "${userLogin}" via Reward "${reward.title}" gutgeschrieben`
    )
    return
  }

  if (reward.actionType !== 'none') {
    logger.warn(
      `Redemption-Aktion für Reward "${reward.title}" übersprungen: actionType=${reward.actionType}, aber keine gültige actionPayload konfiguriert`
    )
  }
}
