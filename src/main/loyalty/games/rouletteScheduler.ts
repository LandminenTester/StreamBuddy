import type { Client } from 'tmi.js'
import type { RouletteColor } from '@shared/types/roulette'
import { colorForNumber } from '@shared/types/roulette'
import { creditLoyalty, debitLoyalty } from '../loyaltyLedger'
import { getGameRuntimeConfig, isGameEnabled, pickGameText } from './gameRegistry'
import { logRouletteRound } from '../../db/repositories/rouletteRounds.repo'
import { isStreamLive } from '../../stats/viewerCountPoller'
import { logger } from '../../logger'

interface RouletteConfig {
  bettingWindowSeconds: number
  spinDelayMinSeconds: number
  spinDelayMaxSeconds: number
  minBet: number
  maxBet: number
  greenPayoutMultiplier: number
  numberPayoutMultiplier: number
}

type RouletteBetValue = { kind: 'color'; color: RouletteColor } | { kind: 'number'; number: number }
type RouletteBet = RouletteBetValue & { userLogin: string; amount: number }

const COLOR_LABELS: Record<RouletteColor, string> = {
  rot: 'ROT',
  schwarz: 'SCHWARZ',
  gruen: 'GRÜN'
}

export const COLOR_EMOJI: Record<RouletteColor, string> = { rot: '🔴', schwarz: '⚫', gruen: '🟢' }

/** Wetten der aktuell laufenden Runde, keyed by Nutzer-Login. */
const currentRoundBets = new Map<string, RouletteBet>()

let activeClient: Client | null = null
let activeChannel: string | null = null
let phaseTimer: NodeJS.Timeout | null = null
let bettingOpen = false

function getConfig(): RouletteConfig {
  return getGameRuntimeConfig('roulette') as unknown as RouletteConfig
}

/** Echte Zahl 0-36 gleichverteilt -- ergibt exakt die 1/18/18-Verteilung fuer die Farbe. */
function spinNumber(): number {
  return Math.floor(Math.random() * 37)
}

function randomBetween(minSeconds: number, maxSeconds: number): number {
  const min = Math.min(minSeconds, maxSeconds)
  const max = Math.max(minSeconds, maxSeconds)
  return min + Math.random() * (max - min)
}

function fillPlaceholders(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  )
}

async function announce(message: string): Promise<void> {
  if (!activeClient || !activeChannel || !message) return
  try {
    await activeClient.say(activeChannel, message)
  } catch (error) {
    logger.error('Roulette: Konnte Chat-Nachricht nicht senden', error)
  }
}

function clearPhaseTimer(): void {
  if (phaseTimer) clearTimeout(phaseTimer)
  phaseTimer = null
}

function placeRoundBet(
  userLogin: string,
  amount: number,
  bet: RouletteBetValue
): { ok: true } | { ok: false; reason: string } {
  if (!bettingOpen) {
    return {
      ok: false,
      reason: 'Das Wettfenster ist gerade geschlossen -- warte auf die nächste Runde.'
    }
  }

  const login = userLogin.toLowerCase()
  if (currentRoundBets.has(login)) {
    return { ok: false, reason: 'Du hast in dieser Runde bereits gesetzt.' }
  }

  try {
    const transaction = debitLoyalty(login, amount, 'game_loss', 'roulette')
    if (!transaction) {
      return { ok: false, reason: 'Konto gesperrt.' }
    }
  } catch {
    return { ok: false, reason: 'Nicht genug Punkte.' }
  }

  currentRoundBets.set(login, { userLogin: login, amount, ...bet })
  return { ok: true }
}

/**
 * Registriert eine Farb-Wette für die aktuell offene Runde. Der Einsatz wird sofort
 * abgebucht (verhindert doppeltes Verwetten desselben Guthabens); nur eine
 * offene Wette pro Nutzer und Runde, unabhängig von Farbe/Zahl.
 */
export function placeBet(
  userLogin: string,
  color: RouletteColor,
  amount: number
): { ok: true } | { ok: false; reason: string } {
  return placeRoundBet(userLogin, amount, { kind: 'color', color })
}

/** Registriert eine Zahlen-Wette (0-36) für die aktuell offene Runde. */
export function placeNumberBet(
  userLogin: string,
  number: number,
  amount: number
): { ok: true } | { ok: false; reason: string } {
  if (!Number.isInteger(number) || number < 0 || number > 36) {
    return { ok: false, reason: 'Zahl muss zwischen 0 und 36 liegen.' }
  }
  return placeRoundBet(userLogin, amount, { kind: 'number', number })
}

function startBettingWindow(): void {
  if (!activeClient || !isGameEnabled('roulette')) return
  if (!isStreamLive()) {
    scheduleLiveRetry()
    return
  }

  currentRoundBets.clear()
  bettingOpen = true
  const config = getConfig()

  const text = pickGameText('roulette', 'roundStart')
  void announce(fillPlaceholders(text, { seconds: config.bettingWindowSeconds }))

  clearPhaseTimer()
  phaseTimer = setTimeout(() => closeBettingAndSpin(), config.bettingWindowSeconds * 1000)
}

function closeBettingAndSpin(): void {
  bettingOpen = false
  const config = getConfig()

  const text = pickGameText('roulette', 'spinning')
  void announce(text)

  clearPhaseTimer()
  const delaySeconds = randomBetween(config.spinDelayMinSeconds, config.spinDelayMaxSeconds)
  phaseTimer = setTimeout(() => void resolveRound(), delaySeconds * 1000)
}

async function resolveRound(): Promise<void> {
  const config = getConfig()
  const winningNumber = spinNumber()
  const winningColor = colorForNumber(winningNumber)
  const bets = new Map(currentRoundBets)
  currentRoundBets.clear()
  logRouletteRound(winningColor, winningNumber)

  let winnerCount = 0
  for (const [login, bet] of bets) {
    const won = bet.kind === 'color' ? bet.color === winningColor : bet.number === winningNumber
    if (!won) continue
    winnerCount++
    const multiplier =
      bet.kind === 'number'
        ? config.numberPayoutMultiplier
        : winningColor === 'gruen'
          ? config.greenPayoutMultiplier
          : 2
    // Der Einsatz wurde beim Setzen bereits abgebucht (als game_loss verbucht) --
    // hier wird der volle Gewinn (Einsatz * Multiplikator) gutgeschrieben.
    creditLoyalty(login, Math.floor(bet.amount * multiplier), 'game_win', 'roulette')
  }

  const text = pickGameText('roulette', 'result')
  await announce(
    fillPlaceholders(text, {
      color: COLOR_LABELS[winningColor],
      colorEmoji: COLOR_EMOJI[winningColor],
      number: winningNumber,
      winners: winnerCount,
      total: bets.size
    })
  )

  startBettingWindow()
}

/** Prüft alle 30s erneut, ob der Stream inzwischen live ist, um die nächste Runde zu starten. */
function scheduleLiveRetry(): void {
  clearPhaseTimer()
  phaseTimer = setTimeout(() => startBettingWindow(), 30_000)
}

/** Startet die Runden-Statemachine, gekoppelt an die Chat-Verbindung (siehe tmiClient.ts). */
export function startRouletteScheduler(client: Client, channel: string): void {
  activeClient = client
  activeChannel = channel
  startBettingWindow()
}

export function stopRouletteScheduler(): void {
  clearPhaseTimer()
  currentRoundBets.clear()
  bettingOpen = false
  activeClient = null
  activeChannel = null
}
