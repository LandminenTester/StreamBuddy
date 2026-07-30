import type { LoyaltyEarnRule } from '@shared/types/loyalty'

export const EARN_RULE_LABELS: Record<LoyaltyEarnRule['reason'], string> = {
  follow: 'Follow',
  sub: 'Sub',
  gift_sub: 'Gifted Sub (pro Sub)',
  view_time: 'View-Time-Tick'
}

export const GAME_LABELS: Record<string, string> = {
  gamble: 'Gamble',
  duel: 'Duell'
}

/** Nur numerische Config-Felder eines Spiels sind über die generische UI editierbar. */
export function numericConfigEntries(config: Record<string, unknown>): [string, number][] {
  return Object.entries(config).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number'
  )
}
