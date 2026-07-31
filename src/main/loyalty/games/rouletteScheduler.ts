import type { Client } from 'tmi.js'
import type { RouletteColor } from '@shared/types/roulette'
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
}

interface RouletteBet {
  color: RouletteColor
  amount: number
}

const COLOR_LABELS: Record<RouletteColor, string> = {
  rot: 'ROT',
  schwarz: 'SCHWARZ',
  gruen: 'GRÜN'
}

/** Wetten der aktuell laufenden Runde, keyed by Nutzer-Login. */
const currentRoundBets = new Map<string, RouletteBet>()

let activeClient: Client | null = null
let activeChannel: string | null = null
let phaseTimer: NodeJS.Timeout | null = null
let bettingOpen = false

function getConfig(): RouletteConfig {
  return getGameRuntimeConfig('roulette') as unknown as RouletteConfig
}

/** 18 Rot, 18 Schwarz, 1 Grün von 37 -- wie beim echten Roulette. */
function spinColor(): RouletteColor {
  const roll = Math.random() * 37
  if (roll < 1) return 'gruen'
  return roll < 19 ? 'rot' : 'schwarz'
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

/**
 * Registriert eine Wette für die aktuell offene Runde. Der Einsatz wird sofort
 * abgebucht (verhindert doppeltes Verwetten desselben Guthabens); nur eine
 * offene Wette pro Nutzer und Runde, unabhängig von der Farbe.
 */
export function placeBet(
  userLogin: string,
  color: RouletteColor,
  amount: number
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

  currentRoundBets.set(login, { color, amount })
  return { ok: true }
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
  const winningColor = spinColor()
  const bets = new Map(currentRoundBets)
  currentRoundBets.clear()
  logRouletteRound(winningColor)

  let winnerCount = 0
  for (const [login, bet] of bets) {
    if (bet.color !== winningColor) continue
    winnerCount++
    const multiplier = winningColor === 'gruen' ? config.greenPayoutMultiplier : 2
    // Der Einsatz wurde beim Setzen bereits abgebucht (als game_loss verbucht) --
    // hier wird der volle Gewinn (Einsatz * Multiplikator) gutgeschrieben.
    creditLoyalty(login, Math.floor(bet.amount * multiplier), 'game_win', 'roulette')
  }

  const text = pickGameText('roulette', 'result')
  await announce(
    fillPlaceholders(text, {
      color: COLOR_LABELS[winningColor],
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
