import type { LoyaltyEarnRule, LoyaltyGameInfo } from '@shared/types/loyalty'
import { i18n, t } from '@renderer/i18n'

export function earnRuleLabel(reason: LoyaltyEarnRule['reason']): string {
  return t(`loyalty.earnRule.${reason}`)
}

/** Kanonischer Name eines Spiels; unbekannte Game-IDs fallen auf die ID zurueck. */
export function gameLabel(gameId: string): string {
  const key = `games.name.${gameId}`
  return i18n.global.te(key) ? t(key) : gameId
}

export function textSlotLabel(slot: string): string {
  const key = `games.textSlot.${slot}`
  return i18n.global.te(key) ? t(key) : slot
}

export function gameDisplayName(game: LoyaltyGameInfo): string {
  return game.displayName || gameLabel(game.gameId)
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
