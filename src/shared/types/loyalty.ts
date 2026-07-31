export type LoyaltyTransactionReason =
  'follow' | 'sub' | 'gift_sub' | 'view_time' | 'game_win' | 'game_loss' | 'manual_adjust'

export interface LoyaltyAccount {
  id: number
  userLogin: string
  balance: number
  totalEarned: number
  totalWagered: number
  lastSeenAt: number | null
  isBlacklisted: boolean
}

export interface LoyaltyTransaction {
  id: number
  accountId: number
  amount: number
  reason: LoyaltyTransactionReason
  gameId: string | null
  createdAt: number
}

export interface LoyaltyGameHistoryEntry extends LoyaltyTransaction {
  userLogin: string
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
  displayName: string | null
  /** Rohe Trigger-Overrides wie in der DB gespeichert (key -> Trigger), z.B. { red: '!r' }. */
  commandTriggers: Record<string, string>
  /** Rohe Text-Varianten-Overrides wie in der DB gespeichert (Slot -> Varianten). */
  texts: Record<string, string[]>
}

export interface LoyaltyGameCommandInfo {
  key: string
  /** Effektiv wirksamer Trigger (Override falls vorhanden, sonst defaultTrigger). */
  trigger: string
  defaultTrigger: string
}

export interface LoyaltyGameInfo extends LoyaltyGameConfig {
  commands: LoyaltyGameCommandInfo[]
  /** Default-Textvarianten aus dem Code, als Platzhalter/Fallback in der UI. */
  defaultTexts: Record<string, string[]>
}

export interface LoyaltyGameStats {
  gameId: string
  winCount: number
  lossCount: number
  totalWon: number
  totalLost: number
  actualWinRatePercent: number
}

export interface LoyaltyLeaderboardEntry {
  userLogin: string
  balance: number
  rank: number
}
