import type { RewardActionType } from '@shared/types/channelPointReward'

export interface RewardFormState {
  id: number | null
  title: string
  cost: number
  prompt: string
  isEnabled: boolean
  autoFulfill: boolean
  actionType: RewardActionType
  actionMessage: string
  actionCommandId: number | null
  backgroundColor: string
  loyaltyExchangeMode: 'rate' | 'fixed'
  loyaltyExchangeValue: number
}

export function emptyRewardForm(): RewardFormState {
  return {
    id: null,
    title: '',
    cost: 100,
    prompt: '',
    isEnabled: true,
    autoFulfill: true,
    actionType: 'none',
    actionMessage: '',
    actionCommandId: null,
    backgroundColor: '#9146FF',
    loyaltyExchangeMode: 'rate',
    loyaltyExchangeValue: 10
  }
}
