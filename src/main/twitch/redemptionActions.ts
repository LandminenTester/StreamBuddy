import type { ChannelPointReward } from '@shared/types/channelPointReward'
import { sendChatMessage } from './chat/tmiClient'
import { getCommandById } from '../db/repositories/commands.repo'
import { logger } from '../logger'

/** Führt die konfigurierte Aktion eines Custom Rewards nach einer Redemption aus. */
export async function runRedemptionAction(reward: ChannelPointReward): Promise<void> {
  if (reward.actionType === 'chat_message' && reward.actionPayload?.message) {
    await sendChatMessage(reward.actionPayload.message)
    return
  }

  if (reward.actionType === 'trigger_command' && reward.actionPayload?.commandId) {
    try {
      const command = getCommandById(reward.actionPayload.commandId)
      await sendChatMessage(command.response)
    } catch (error) {
      logger.error(`Redemption-Aktion: Command nicht gefunden für Reward "${reward.title}"`, error)
    }
  }
}
