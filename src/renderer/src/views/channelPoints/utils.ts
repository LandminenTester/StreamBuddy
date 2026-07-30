import type { ChannelPointReward, RewardActionType } from '@shared/types/channelPointReward'
import type { RewardFormState } from './types'

export const ACTION_TYPE_LABELS: Record<RewardActionType, string> = {
  none: 'Keine Aktion',
  chat_message: 'Chat-Nachricht senden',
  trigger_command: 'Command auslösen'
}

export function rewardToFormState(reward: ChannelPointReward): RewardFormState {
  return {
    id: reward.id,
    title: reward.title,
    cost: reward.cost,
    prompt: reward.prompt ?? '',
    isEnabled: reward.isEnabled,
    autoFulfill: reward.autoFulfill,
    actionType: reward.actionType,
    actionMessage: reward.actionPayload?.message ?? '',
    actionCommandId: reward.actionPayload?.commandId ?? null,
    backgroundColor: reward.backgroundColor ?? '#9146FF'
  }
}
