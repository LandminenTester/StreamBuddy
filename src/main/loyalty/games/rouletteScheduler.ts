import type { Client } from 'tmi.js'
import { creditLoyalty, debitLoyalty } from '../loyaltyLedger'
import { getGameRuntimeConfig, isGameEnabled } from './gameRegistry'
import { logger } from '../../logger'

export type RouletteColor = 'rot' | 'schwarz' | 'gruen'

interface RouletteConfig {
  roundIntervalSeconds: number
  minBet: number
  maxBet: number
  greenPayoutMultiplier: number
}

interface RouletteBet {
  color: RouletteColor
  amount: number
}

/** Wetten der aktuell laufenden Runde, keyed by Nutzer-Login. */
const currentRoundBets = new Map<string, RouletteBet>()

let activeClient: Client | null = null
let activeChannel: string | null = null
let roundTimer: NodeJS.Timeout | null = null

function getConfig(): RouletteConfig {
  return getGameRuntimeConfig('roulette') as unknown as RouletteConfig
}

/** 18 Rot, 18 Schwarz, 1 Grün von 37 -- wie beim echten Roulette. */
function spinColor(): RouletteColor {
  const roll = Math.random() * 37
  if (roll < 1) return 'gruen'
  return roll < 19 ? 'rot' : 'schwarz'
}

async function announce(message: string): Promise<void> {
  if (!activeClient || !activeChannel) return
  try {
    await activeClient.say(activeChannel, message)
  } catch (error) {
    logger.error('Roulette: Konnte Chat-Nachricht nicht senden', error)
  }
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

async function resolveRound(): Promise<void> {
  if (currentRoundBets.size === 0) {
    await announce(
      `🎰 Roulette: Niemand hat gesetzt. Neue Runde läuft (${getConfig().roundIntervalSeconds}s)!`
    )
    return
  }

  const config = getConfig()
  const winningColor = spinColor()
  const bets = new Map(currentRoundBets)
  currentRoundBets.clear()

  let winnerCount = 0
  for (const [login, bet] of bets) {
    if (bet.color !== winningColor) continue
    winnerCount++
    const multiplier = winningColor === 'gruen' ? config.greenPayoutMultiplier : 2
    // Der Einsatz wurde beim Setzen bereits abgebucht (als game_loss verbucht) --
    // hier wird der volle Gewinn (Einsatz * Multiplikator) gutgeschrieben.
    creditLoyalty(login, Math.floor(bet.amount * multiplier), 'game_win', 'roulette')
  }

  await announce(
    `🎰 Roulette: ${winningColor.toUpperCase()} gewinnt! ${winnerCount}/${bets.size} Wetten haben gewonnen. Neue Runde läuft (${config.roundIntervalSeconds}s)!`
  )
}

function scheduleNextRound(): void {
  if (roundTimer) clearTimeout(roundTimer)
  const config = getConfig()

  roundTimer = setTimeout(async () => {
    await resolveRound()
    if (activeClient && isGameEnabled('roulette')) scheduleNextRound()
  }, config.roundIntervalSeconds * 1000)
}

/** Startet den Runden-Timer, gekoppelt an die Chat-Verbindung (siehe tmiClient.ts). */
export function startRouletteScheduler(client: Client, channel: string): void {
  activeClient = client
  activeChannel = channel
  if (!isGameEnabled('roulette')) return
  scheduleNextRound()
}

export function stopRouletteScheduler(): void {
  if (roundTimer) clearTimeout(roundTimer)
  roundTimer = null
  currentRoundBets.clear()
  activeClient = null
  activeChannel = null
}
