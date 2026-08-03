export type RewardActionType = 'none' | 'chat_message' | 'trigger_command' | 'loyalty_exchange'

export interface RewardActionPayload {
  message?: string
  commandId?: number
  loyaltyExchangeMode?: 'rate' | 'fixed'
  loyaltyExchangeValue?: number
}

export interface ChannelPointReward {
  id: number
  twitchRewardId: string | null
  title: string
  cost: number
  prompt: string | null
  isEnabled: boolean
  autoFulfill: boolean
  actionType: RewardActionType
  actionPayload: RewardActionPayload | null
  backgroundColor: string | null
  syncedAt: number | null
  createdAt: number
}

export type ChannelPointRewardInput = Omit<
  ChannelPointReward,
  'id' | 'twitchRewardId' | 'syncedAt' | 'createdAt'
>

export type RedemptionStatus = 'unfulfilled' | 'fulfilled' | 'canceled'

export interface RedemptionLogEntry {
  id: number
  rewardId: number
  rewardTitle?: string
  twitchRedemptionId: string
  userLogin: string
  userInput: string | null
  status: RedemptionStatus
  redeemedAt: number
  actionProcessedAt?: number | null
}
