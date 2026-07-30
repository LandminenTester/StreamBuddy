export type LoyaltyTransactionReason =
  'follow' | 'sub' | 'gift_sub' | 'view_time' | 'game_win' | 'game_loss' | 'manual_adjust'

export interface LoyaltyAccount {
  id: number
  userLogin: string
  balance: number
  totalEarned: number
  totalWagered: number
  lastSeenAt: number | null
}

export interface LoyaltyTransaction {
  id: number
  accountId: number
  amount: number
  reason: LoyaltyTransactionReason
  gameId: string | null
  createdAt: number
}

export interface LoyaltyEarnRule {
  reason: 'follow' | 'sub' | 'gift_sub' | 'view_time'
  points: number
  enabled: boolean
  cooldownSeconds: number
}

export interface LoyaltyGameConfig {
  gameId: string
  enabled: boolean
  config: Record<string, unknown>
}

export interface LoyaltyGameInfo extends LoyaltyGameConfig {
  commandTrigger: string
}

export interface LoyaltyLeaderboardEntry {
  userLogin: string
  balance: number
  rank: number
}
