import type { LoyaltyEarnRule, LoyaltyGameInfo } from '@shared/types/loyalty'

export const EARN_RULE_LABELS: Record<LoyaltyEarnRule['reason'], string> = {
  follow: 'Follow',
  sub: 'Sub',
  gift_sub: 'Gifted Sub (pro Sub)',
  view_time: 'View-Time-Tick'
}

export const GAME_LABELS: Record<string, string> = {
  gamble: 'Gamble',
  duel: 'Duell',
  roulette: 'Roulette'
}

export const TEXT_SLOT_LABELS: Record<string, string> = {
  roundStart: 'Runden-Start',
  spinning: 'Dreh-/Wartephase',
  result: 'Ergebnis'
}

export function gameDisplayName(game: LoyaltyGameInfo): string {
  return game.displayName || GAME_LABELS[game.gameId] || game.gameId
}

/** Nur numerische Config-Felder eines Spiels sind über die generische UI editierbar. */
export function numericConfigEntries(config: Record<string, unknown>): [string, number][] {
  return Object.entries(config).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number'
  )
}

/** Alle Text-Slot-Schlüssel eines Games (Defaults + evtl. bereits gespeicherte Overrides). */
export function gameTextSlots(game: LoyaltyGameInfo): string[] {
  return [...new Set([...Object.keys(game.defaultTexts), ...Object.keys(game.texts)])]
}

/** Aktuell wirksame Textvarianten für einen Slot (Override falls vorhanden, sonst Default). */
export function resolvedTextVariants(game: LoyaltyGameInfo, slot: string): string[] {
  return game.texts[slot] ?? game.defaultTexts[slot] ?? []
}
