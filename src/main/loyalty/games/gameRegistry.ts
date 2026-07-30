import type { LoyaltyGame } from './LoyaltyGame'
import { gambleGame } from './gambleGame'
import { duelGame } from './duelGame'
import { rouletteGame } from './rouletteGame'
import { listGameConfigs, seedDefaultGameConfig } from '../../db/repositories/loyalty.repo'

const GAMES: readonly LoyaltyGame[] = [gambleGame, duelGame, rouletteGame]

export function getAllGames(): readonly LoyaltyGame[] {
  return GAMES
}

export function getGameByTrigger(trigger: string): LoyaltyGame | undefined {
  return GAMES.find((game) => game.commandTrigger === trigger)
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

/** Seedet Default-Configs für alle registrierten Spiele beim ersten Start. */
export function seedGameDefaults(): void {
  for (const game of GAMES) {
    seedDefaultGameConfig(game.id, game.defaultConfig)
  }
}
