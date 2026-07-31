import { getDb } from '../connection'
import type { RouletteColor } from '@shared/types/roulette'

export function logRouletteRound(winningColor: RouletteColor): void {
  getDb()
    .prepare('INSERT INTO roulette_rounds (winning_color, created_at) VALUES (?, ?)')
    .run(winningColor, Date.now())
}

/** Neueste zuerst, wie sie im Chat als Farbfolge angezeigt werden. */
export function listRecentRouletteColors(limit = 20): RouletteColor[] {
  return getDb()
    .prepare<[number], { winning_color: RouletteColor }>(
      'SELECT winning_color FROM roulette_rounds ORDER BY id DESC LIMIT ?'
    )
    .all(limit)
    .map((row) => row.winning_color)
}
