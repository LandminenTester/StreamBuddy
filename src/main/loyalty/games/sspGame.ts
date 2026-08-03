import type { LoyaltyGame, LoyaltyGameContext } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { creditLoyalty, debitLoyalty } from '../loyaltyLedger'
import { parseBetAmount } from './betParser'

type Move = 'schere' | 'stein' | 'papier'

interface SspConfig {
  acceptWindowSeconds: number
  resultDelaySeconds: number
  minBet: number
  maxBet: number
}

interface PendingSspMatch {
  challenger: string
  opponent: string
  amount: number
  expiresAt: number
}

interface ActiveSspMatch extends PendingSspMatch {
  mappings: Record<string, Record<1 | 2 | 3, Move>>
  choices: Map<string, Move>
  resolving: boolean
}

const MOVES: Move[] = ['schere', 'stein', 'papier']
const pendingMatches = new Map<string, PendingSspMatch>()
const activeMatches = new Map<string, ActiveSspMatch>()

function cleanLogin(login: string): string {
  return login.replace(/^@/, '').trim().toLowerCase()
}

function matchKey(a: string, b: string): string {
  return [a, b].sort().join(':')
}

function shuffledMapping(): Record<1 | 2 | 3, Move> {
  const shuffled = [...MOVES].sort(() => Math.random() - 0.5)
  return { 1: shuffled[0], 2: shuffled[1], 3: shuffled[2] }
}

function formatMapping(mapping: Record<1 | 2 | 3, Move>): string {
  return `1=${mapping[1]}, 2=${mapping[2]}, 3=${mapping[3]}`
}

function winningMove(move: Move): Move {
  if (move === 'schere') return 'papier'
  if (move === 'stein') return 'schere'
  return 'stein'
}

function resolveWinner(match: ActiveSspMatch): string | null {
  const challengerMove = match.choices.get(match.challenger)
  const opponentMove = match.choices.get(match.opponent)
  if (!challengerMove || !opponentMove || challengerMove === opponentMove) return null
  return winningMove(challengerMove) === opponentMove ? match.challenger : match.opponent
}

function findActiveMatch(login: string): ActiveSspMatch | null {
  for (const match of activeMatches.values()) {
    if (match.challenger === login || match.opponent === login) return match
  }
  return null
}

async function challenge(ctx: LoyaltyGameContext, config: SspConfig): Promise<void> {
  const challenger = cleanLogin(ctx.userLogin)
  const opponent = cleanLogin(ctx.args[0] ?? '')
  const challengerAccount = getOrCreateAccount(challenger)
  const amount = parseBetAmount(
    ctx.args[1],
    challengerAccount.balance,
    config.minBet,
    config.maxBet
  )

  if (!opponent || amount === null) {
    await ctx.reply(`@${challenger} Nutzung: !ssp @user <Punkte|all|xx%>`)
    return
  }
  if (opponent === challenger) {
    await ctx.reply(`@${challenger} Du kannst nicht gegen dich selbst spielen.`)
    return
  }
  if (findActiveMatch(challenger) || findActiveMatch(opponent)) {
    await ctx.reply(`@${challenger} Einer von euch spielt bereits Schere Stein Papier.`)
    return
  }

  pendingMatches.set(opponent, {
    challenger,
    opponent,
    amount,
    expiresAt: Date.now() + config.acceptWindowSeconds * 1000
  })

  await ctx.reply(
    `@${opponent} wurde von @${challenger} zu Schere Stein Papier um ${amount} Punkte herausgefordert. Mit !ssp accept annehmen.`
  )
}

async function accept(ctx: LoyaltyGameContext): Promise<void> {
  const opponent = cleanLogin(ctx.userLogin)
  const pending = pendingMatches.get(opponent)
  if (!pending || pending.expiresAt < Date.now()) {
    pendingMatches.delete(opponent)
    await ctx.reply(`@${opponent} Keine offene SSP-Herausforderung.`)
    return
  }

  const challengerAccount = getOrCreateAccount(pending.challenger)
  const opponentAccount = getOrCreateAccount(opponent)
  if (challengerAccount.balance < pending.amount || opponentAccount.balance < pending.amount) {
    pendingMatches.delete(opponent)
    await ctx.reply(`@${opponent} SSP abgebrochen -- nicht genug Punkte bei einem Teilnehmer.`)
    return
  }

  pendingMatches.delete(opponent)
  const match: ActiveSspMatch = {
    ...pending,
    mappings: {
      [pending.challenger]: shuffledMapping(),
      [opponent]: shuffledMapping()
    },
    choices: new Map(),
    resolving: false
  }
  activeMatches.set(matchKey(pending.challenger, opponent), match)

  await ctx.whisper(
    pending.challenger,
    `SSP gegen @${opponent}: Antworte mit !ssp 1, !ssp 2 oder !ssp 3. Deine Zuordnung: ${formatMapping(match.mappings[pending.challenger])}.`
  )
  await ctx.whisper(
    opponent,
    `SSP gegen @${pending.challenger}: Antworte mit !ssp 1, !ssp 2 oder !ssp 3. Deine Zuordnung: ${formatMapping(match.mappings[opponent])}.`
  )
  await ctx.reply(
    `SSP zwischen @${pending.challenger} und @${opponent} wurde angenommen. Beide haben ihre Optionen privat erhalten.`
  )
}

async function choose(ctx: LoyaltyGameContext, config: SspConfig): Promise<void> {
  const login = cleanLogin(ctx.userLogin)
  const choice = Number(ctx.args[0])
  if (choice !== 1 && choice !== 2 && choice !== 3) return

  const match = findActiveMatch(login)
  if (!match) {
    await ctx.whisper(login, 'Du hast gerade kein aktives SSP-Spiel.')
    return
  }
  if (match.choices.has(login)) {
    await ctx.whisper(login, 'Deine SSP-Auswahl wurde bereits gespeichert.')
    return
  }

  const move = match.mappings[login][choice]
  match.choices.set(login, move)
  await ctx.whisper(login, `Auswahl gespeichert: ${choice}. Warte auf den anderen Spieler.`)

  if (match.choices.size === 2 && !match.resolving) {
    match.resolving = true
    setTimeout(() => void finishMatch(ctx, match), config.resultDelaySeconds * 1000)
  }
}

async function finishMatch(ctx: LoyaltyGameContext, match: ActiveSspMatch): Promise<void> {
  activeMatches.delete(matchKey(match.challenger, match.opponent))
  const winner = resolveWinner(match)
  const challengerMove = match.choices.get(match.challenger)
  const opponentMove = match.choices.get(match.opponent)
  if (!challengerMove || !opponentMove) return

  if (!winner) {
    await ctx.reply(
      `SSP endet unentschieden: @${match.challenger} (${challengerMove}) gegen @${match.opponent} (${opponentMove}).`
    )
    return
  }

  const loser = winner === match.challenger ? match.opponent : match.challenger
  try {
    debitLoyalty(loser, match.amount, 'game_loss', 'ssp')
    creditLoyalty(winner, match.amount, 'game_win', 'ssp')
  } catch {
    await ctx.reply('SSP abgebrochen -- Punkte konnten beim Abschluss nicht gebucht werden.')
    return
  }

  await ctx.reply(
    `SSP entschieden: @${winner} gewinnt ${match.amount} Punkte! @${match.challenger} (${challengerMove}) gegen @${match.opponent} (${opponentMove}).`
  )
}

async function handleSsp(ctx: LoyaltyGameContext): Promise<void> {
  const config = ctx.config as unknown as SspConfig
  const firstArg = ctx.args[0]?.toLowerCase()
  if (firstArg === 'accept' || firstArg === 'annehmen') {
    await accept(ctx)
    return
  }
  if (firstArg === '1' || firstArg === '2' || firstArg === '3') {
    await choose(ctx, config)
    return
  }
  await challenge(ctx, config)
}

export const sspGame: LoyaltyGame = {
  id: 'ssp',
  defaultConfig: {
    acceptWindowSeconds: 60,
    resultDelaySeconds: 5,
    minBet: 10,
    maxBet: 1000
  } satisfies SspConfig,
  commands: [{ key: 'play', defaultTrigger: '!ssp', handleCommand: handleSsp }]
}
