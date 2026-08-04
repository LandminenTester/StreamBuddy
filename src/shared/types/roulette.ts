export type RouletteColor = 'rot' | 'schwarz' | 'gruen'

export interface RouletteRoundResult {
  color: RouletteColor
  number: number | null
}

/** Echte Roulette-Zuordnung (europäisches Rad, 0 = Grün). */
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

export function colorForNumber(n: number): RouletteColor {
  if (n === 0) return 'gruen'
  return RED_NUMBERS.has(n) ? 'rot' : 'schwarz'
}

export type RoulettePhase = 'closed' | 'betting' | 'spinning' | 'cooldown'

export interface RouletteState {
  phase: RoulettePhase
  /** Zeitstempel (ms), zu dem die aktuelle Phase endet, oder null wenn nicht aktiv/unbekannt. */
  phaseEndsAt: number | null
}
