import type { LoyaltyGame, LoyaltyGameCommand } from './LoyaltyGame'
import { gambleGame } from './gambleGame'
import { duelGame } from './duelGame'
import { rouletteGame } from './rouletteGame'
import { listGameConfigs, seedDefaultGameConfig } from '../../db/repositories/loyalty.repo'

const GAMES: readonly LoyaltyGame[] = [gambleGame, duelGame, rouletteGame]

export function getAllGames(): readonly LoyaltyGame[] {
  return GAMES
}

/** Effektiv wirksamer Trigger: Override aus der DB, sonst der im Code hinterlegte Default. */
export function resolveCommandTrigger(gameId: string, command: LoyaltyGameCommand): string {
  const stored = listGameConfigs().find((c) => c.gameId === gameId)
  return stored?.commandTriggers[command.key] ?? command.defaultTrigger
}

/** Findet das Game + den konkreten Command anhand des aktuell wirksamen (ggf. umbenannten) Triggers. */
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
  const stored = listGameConfigs().find((c) => c.gameId === gameId)
  return stored?.enabled ?? true
}

/** Merged Default-Config des Spiels mit den in der DB gespeicherten Overrides. */
export function getGameRuntimeConfig(gameId: string): Record<string, unknown> {
  const game = GAMES.find((g) => g.id === gameId)
  const stored = listGameConfigs().find((c) => c.gameId === gameId)
  return { ...(game?.defaultConfig ?? {}), ...(stored?.config ?? {}) }
}

/** Merged Default-Texte des Spiels mit den in der DB gespeicherten Overrides (pro Slot). */
export function getGameRuntimeTexts(gameId: string): Record<string, string[]> {
  const game = GAMES.find((g) => g.id === gameId)
  const stored = listGameConfigs().find((c) => c.gameId === gameId)
  return { ...(game?.defaultTexts ?? {}), ...(stored?.texts ?? {}) }
}

/** Zufällige Textvariante aus dem gemergten Text-Slot, oder ein Leerstring falls keine Varianten existieren. */
export function pickGameText(gameId: string, slot: string): string {
  const variants = getGameRuntimeTexts(gameId)[slot] ?? []
  if (variants.length === 0) return ''
  return variants[Math.floor(Math.random() * variants.length)]
}

/** Seedet Default-Configs für alle registrierten Spiele beim ersten Start. */
export function seedGameDefaults(): void {
  for (const game of GAMES) {
    seedDefaultGameConfig(game.id, game.defaultConfig)
  }
}
