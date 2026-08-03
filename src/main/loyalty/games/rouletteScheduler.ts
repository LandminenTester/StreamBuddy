import type { RouletteColor } from '@shared/types/roulette'
import { colorForNumber } from '@shared/types/roulette'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { creditLoyalty, debitLoyalty } from '../loyaltyLedger'
import { getGameRuntimeConfig, isGameEnabled, pickGameText } from './gameRegistry'
import { logRouletteRound } from '../../db/repositories/rouletteRounds.repo'
import { isStreamLive } from '../../stats/viewerCountPoller'
import { getActiveChatClient } from '../../twitch/chat/chatClientAccessor'
import { logger } from '../../logger'

interface RouletteConfig {
  bettingWindowSeconds: number
  roundCooldownSeconds: number
  spinDelayMinSeconds: number
  spinDelayMaxSeconds: number
  minBet: number
  maxBet: number
  greenPayoutMultiplier: number
  numberPayoutMultiplier: number
}

type RoulettePhase = 'closed' | 'betting' | 'spinning' | 'cooldown'
type RouletteBetValue = { kind: 'color'; color: RouletteColor } | { kind: 'number'; number: number }
type RouletteBet = RouletteBetValue & { userLogin: string; amount: number }

const COLOR_LABELS: Record<RouletteColor, string> = {
  rot: 'ROT',
  schwarz: 'SCHWARZ',
  gruen: 'GRUEN'
}

export const COLOR_EMOJI: Record<RouletteColor, string> = {
  rot: '🔴',
  schwarz: '⚫',
  gruen: '🟢'
}

const currentRoundBets = new Map<string, RouletteBet>()

let activeChannel: string | null = null
let phaseTimer: NodeJS.Timeout | null = null
let phase: RoulettePhase = 'closed'

function getConfig(): RouletteConfig {
  return getGameRuntimeConfig('roulette') as unknown as RouletteConfig
}

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
  const sender = getActiveChatClient()
  if (!sender || !activeChannel || !message) return
  try {
    await sender.say(activeChannel, message)
  } catch (error) {
    logger.error('Roulette: Konnte Chat-Nachricht nicht senden', error)
  }
}

function clearPhaseTimer(): void {
  if (phaseTimer) clearTimeout(phaseTimer)
  phaseTimer = null
}

function isSameBetValue(existing: RouletteBet, next: RouletteBetValue): boolean {
  if (existing.kind !== next.kind) return false
  if (existing.kind === 'color' && next.kind === 'color') return existing.color === next.color
  if (existing.kind === 'number' && next.kind === 'number') return existing.number === next.number
  return false
}

function placeRoundBet(
  userLogin: string,
  amount: number,
  bet: RouletteBetValue
): { ok: true; totalAmount: number } | { ok: false; reason: string } {
  if (phase !== 'betting') {
    return {
      ok: false,
      reason: 'Das Wettfenster ist gerade geschlossen -- warte auf die naechste Runde.'
    }
  }

  const login = userLogin.toLowerCase()
  const existing = currentRoundBets.get(login)
  if (existing && !isSameBetValue(existing, bet)) {
    return { ok: false, reason: 'Du hast in dieser Runde bereits auf etwas anderes gesetzt.' }
  }

  const account = getOrCreateAccount(login)
  if (account.isBlacklisted) return { ok: false, reason: 'Konto gesperrt.' }

  const totalAmount = (existing?.amount ?? 0) + amount
  if (account.balance < totalAmount) {
    return { ok: false, reason: 'Nicht genug Punkte.' }
  }

  currentRoundBets.set(login, { userLogin: login, amount: totalAmount, ...bet })
  return { ok: true, totalAmount }
}

export function placeBet(
  userLogin: string,
  color: RouletteColor,
  amount: number
): { ok: true; totalAmount: number } | { ok: false; reason: string } {
  return placeRoundBet(userLogin, amount, { kind: 'color', color })
}

export function placeNumberBet(
  userLogin: string,
  number: number,
  amount: number
): { ok: true; totalAmount: number } | { ok: false; reason: string } {
  if (!Number.isInteger(number) || number < 0 || number > 36) {
    return { ok: false, reason: 'Zahl muss zwischen 0 und 36 liegen.' }
  }
  return placeRoundBet(userLogin, amount, { kind: 'number', number })
}

function startBettingWindow(): void {
  if (!getActiveChatClient() || !isGameEnabled('roulette')) return
  if (!isStreamLive()) {
    scheduleLiveRetry()
    return
  }

  currentRoundBets.clear()
  phase = 'betting'
  const config = getConfig()

  const text = pickGameText('roulette', 'roundStart')
  void announce(fillPlaceholders(text, { seconds: config.bettingWindowSeconds }))

  clearPhaseTimer()
  phaseTimer = setTimeout(() => closeBettingAndSpin(), config.bettingWindowSeconds * 1000)
}

function closeBettingAndSpin(): void {
  phase = 'spinning'
  const config = getConfig()

  const text = pickGameText('roulette', 'spinning')
  void announce(text)

  clearPhaseTimer()
  const delaySeconds = randomBetween(config.spinDelayMinSeconds, config.spinDelayMaxSeconds)
  phaseTimer = setTimeout(() => void resolveRound(), delaySeconds * 1000)
}

function payoutMultiplier(
  bet: RouletteBet,
  winningColor: RouletteColor,
  config: RouletteConfig
): number {
  if (bet.kind === 'number') return config.numberPayoutMultiplier
  return winningColor === 'gruen' ? config.greenPayoutMultiplier : 2
}

async function resolveRound(): Promise<void> {
  const config = getConfig()
  const winningNumber = spinNumber()
  const winningColor = colorForNumber(winningNumber)
  const bets = new Map(currentRoundBets)
  currentRoundBets.clear()
  logRouletteRound(winningColor, winningNumber)

  let winnerCount = 0
  const winnerDetails: string[] = []

  for (const [login, bet] of bets) {
    const won = bet.kind === 'color' ? bet.color === winningColor : bet.number === winningNumber
    if (!won) {
      try {
        debitLoyalty(login, bet.amount, 'game_loss', 'roulette')
      } catch {
        logger.warn(`Roulette: Einsatz von ${login} konnte nicht abgebucht werden`)
      }
      continue
    }

    winnerCount++
    const netWin = Math.floor(bet.amount * (payoutMultiplier(bet, winningColor, config) - 1))
    creditLoyalty(login, netWin, 'game_win', 'roulette')
    winnerDetails.push(`@${login} +${netWin}`)
  }

  const text =
    bets.size === 0 ? pickGameText('roulette', 'noBets') : pickGameText('roulette', 'result')
  await announce(
    fillPlaceholders(text, {
      color: COLOR_LABELS[winningColor],
      colorEmoji: COLOR_EMOJI[winningColor],
      number: winningNumber,
      winners: winnerCount,
      total: bets.size,
      winnerDetails: winnerDetails.join(', ')
    })
  )

  startCooldown()
}

function startCooldown(): void {
  phase = 'cooldown'
  clearPhaseTimer()
  const cooldownSeconds = Math.max(0, getConfig().roundCooldownSeconds)
  phaseTimer = setTimeout(() => startBettingWindow(), cooldownSeconds * 1000)
}

function scheduleLiveRetry(): void {
  phase = 'closed'
  clearPhaseTimer()
  phaseTimer = setTimeout(() => startBettingWindow(), 30_000)
}

export function startRouletteScheduler(channel: string): void {
  activeChannel = channel
  startBettingWindow()
}

export function stopRouletteScheduler(): void {
  clearPhaseTimer()
  currentRoundBets.clear()
  phase = 'closed'
  activeChannel = null
}
