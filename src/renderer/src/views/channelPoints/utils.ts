import type {
  ChannelPointReward,
  RedemptionStatus,
  RewardActionType
} from '@shared/types/channelPointReward'
import type { SelectOption } from '@renderer/components/ui/AppSelect.vue'
import { t } from '@renderer/i18n'
import type { RewardFormState } from './types'

const ACTION_TYPES: RewardActionType[] = [
  'none',
  'chat_message',
  'trigger_command',
  'loyalty_exchange',
  'trigger_effect'
]

export function actionTypeLabel(type: RewardActionType): string {
  return t(`channelPoints.actionType.${type}`)
}

export function actionTypeOptions(): SelectOption[] {
  return ACTION_TYPES.map((value) => ({ value, label: actionTypeLabel(value) }))
}

export function redemptionStatusLabel(status: RedemptionStatus): string {
  return t(`channelPoints.redemptions.status.${status}`)
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
    actionEffectId: reward.actionPayload?.effectId ?? null,
    backgroundColor: reward.backgroundColor ?? '#9146FF',
    loyaltyExchangeMode: reward.actionPayload?.loyaltyExchangeMode ?? 'rate',
    loyaltyExchangeValue: reward.actionPayload?.loyaltyExchangeValue ?? 10
  }
}
