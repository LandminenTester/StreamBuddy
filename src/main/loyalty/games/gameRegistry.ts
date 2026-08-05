import type { CancelledGameRequest, LoyaltyGame, LoyaltyGameCommand } from './LoyaltyGame'
import { gambleGame } from './gambleGame'
import { duelGame } from './duelGame'
import { rouletteGame } from './rouletteGame'
import { sspGame } from './sspGame'
import { listGameConfigs, seedDefaultGameConfig } from '../../db/repositories/loyalty.repo'
import { getLoyaltyPointName } from '../loyaltySettings'
import { isGameTemporarilyUnavailable } from '@shared/temporarilyUnavailable'

const GAMES: readonly LoyaltyGame[] = [gambleGame, duelGame, rouletteGame, sspGame]

export function getAllGames(): readonly LoyaltyGame[] {
  return GAMES
}

export function cancelPendingGameRequests(userLogin: string): CancelledGameRequest[] {
  return GAMES.flatMap((game) => game.cancelPendingRequests?.(userLogin) ?? [])
}

/** Effektiv wirksamer Trigger: Override aus der DB, sonst der im Code hinterlegte Default. */
export function resolveCommandTrigger(gameId: string, command: LoyaltyGameCommand): string {
  const stored = listGameConfigs().find((c) => c.gameId === gameId)
  return stored?.commandTriggers[command.key] ?? command.defaultTrigger
}

/** Findet das Game + den konkreten Command anhand des aktuell wirksamen Triggers. */
export function getGameByTrigger(
  trigger: string
): { game: LoyaltyGame; command: LoyaltyGameCommand } | undefined {
  for (const game of GAMES) {
    for (const command of game.commands) {
      if (resolveCommandTrigger(game.id, command) === trigger) {
        return { game, command }
      }
    }
  }
  return undefined
}

export function isGameEnabled(gameId: string): boolean {
  if (isGameTemporarilyUnavailable(gameId)) return false
  const stored = listGameConfigs().find((c) => c.gameId === gameId)
  return stored?.enabled ?? true
}

/** Merged Default-Config des Spiels mit den in der DB gespeicherten Overrides. */
export function getGameRuntimeConfig(gameId: string): Record<string, unknown> {
  const game = GAMES.find((g) => g.id === gameId)
  const stored = listGameConfigs().find((c) => c.gameId === gameId)
  return { ...(game?.defaultConfig ?? {}), ...(stored?.config ?? {}) }
}

/** Merged Default-Texte des Spiels mit den in der DB gespeicherten Overrides. */
export function getGameRuntimeTexts(gameId: string): Record<string, string[]> {
  const game = GAMES.find((g) => g.id === gameId)
  const stored = listGameConfigs().find((c) => c.gameId === gameId)
  return { ...(game?.defaultTexts ?? {}), ...(stored?.texts ?? {}) }
}

/** Fallback, falls in den Loyalty-Einstellungen kein Punktename gesetzt wurde. */
const POINT_NAME_FALLBACK = 'Punkte'

const COMMAND_PLACEHOLDER_PATTERN = /\{cmd:([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\}/g

/**
 * Ersetzt die kanalweiten Platzhalter in einem Bot-Text:
 * - `{pointname}` -> in den Loyalty-Einstellungen konfigurierter Name der Punkte
 * - `{cmd:spielId.befehl}` -> aktuell wirksamer Trigger, z.B. `{cmd:roulette.red}` -> `!red`
 *
 * Unbekannte Befehls-Platzhalter bleiben unveraendert stehen, damit ein Tippfehler
 * sichtbar wird statt still zu einem leeren String zu werden.
 */
export function resolveTextPlaceholders(text: string): string {
  if (!text) return text

  let result = text
  if (result.includes('{pointname}')) {
    result = result.replaceAll('{pointname}', getLoyaltyPointName() || POINT_NAME_FALLBACK)
  }

  return result.replace(COMMAND_PLACEHOLDER_PATTERN, (match, gameId: string, key: string) => {
    const game = GAMES.find((entry) => entry.id === gameId)
    const command = game?.commands.find((entry) => entry.key === key)
    return command ? resolveCommandTrigger(gameId, command) : match
  })
}

export function pickGameText(gameId: string, slot: string): string {
  const variants = getGameRuntimeTexts(gameId)[slot] ?? []
  if (variants.length === 0) return ''
  return resolveTextPlaceholders(variants[Math.floor(Math.random() * variants.length)])
}

/** Seedet Default-Configs fuer alle registrierten Spiele beim ersten Start. */
export function seedGameDefaults(): void {
  for (const game of GAMES) {
    seedDefaultGameConfig(game.id, game.defaultConfig)
  }
}
