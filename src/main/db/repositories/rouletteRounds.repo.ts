import { getDb } from '../connection'
import type { RouletteColor, RouletteRoundResult } from '@shared/types/roulette'

export function logRouletteRound(winningColor: RouletteColor, winningNumber: number): void {
  getDb()
    .prepare(
      'INSERT INTO roulette_rounds (winning_color, winning_number, created_at) VALUES (?, ?, ?)'
    )
    .run(winningColor, winningNumber, Date.now())
}

/** Neueste zuerst, wie sie im Chat und in der Loyalty-UI angezeigt werden. */
export function listRecentRouletteColors(limit = 20): RouletteRoundResult[] {
  return getDb()
    .prepare<[number], { winning_color: RouletteColor; winning_number: number | null }>(
      'SELECT winning_color, winning_number FROM roulette_rounds ORDER BY id DESC LIMIT ?'
    )
    .all(limit)
    .map((row) => ({ color: row.winning_color, number: row.winning_number }))
}
