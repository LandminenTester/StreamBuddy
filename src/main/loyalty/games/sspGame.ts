import type { CancelledGameRequest, LoyaltyGame, LoyaltyGameContext } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { creditLoyalty, debitLoyalty } from '../loyaltyLedger'
import { parseBetAmount } from './betParser'
import { logger } from '../../logger'

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

function cancelPendingSspMatches(userLogin: string): CancelledGameRequest[] {
  const challenger = cleanLogin(userLogin)
  const now = Date.now()
  const cancelled: CancelledGameRequest[] = []

  for (const [opponent, pending] of pendingMatches) {
    if (pending.challenger !== challenger) continue
    pendingMatches.delete(opponent)
    if (pending.expiresAt >= now) cancelled.push({ gameId: 'ssp', opponent })
  }
  return cancelled
}

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
    await ctx.reply(
      ctx.text('usage', '@{user} Nutzung: !ssp @user <Punkte|all|xx%>', { user: challenger })
    )
    return
  }
  if (opponent === challenger) {
    await ctx.reply(
      ctx.text('selfChallenge', '@{user} Du kannst nicht gegen dich selbst spielen.', {
        user: challenger
      })
    )
    return
  }
  if (findActiveMatch(challenger) || findActiveMatch(opponent)) {
    await ctx.reply(
      ctx.text('alreadyPlaying', '@{user} Einer von euch spielt bereits Schere Stein Papier.', {
        user: challenger
      })
    )
    return
  }

  pendingMatches.set(opponent, {
    challenger,
    opponent,
    amount,
    expiresAt: Date.now() + config.acceptWindowSeconds * 1000
  })

  await ctx.reply(
    ctx.text(
      'challenge',
      '@{opponent} wurde von @{challenger} zu Schere Stein Papier um {amount} Punkte herausgefordert. Mit !ssp accept annehmen. @{challenger} kann mit !cancel abbrechen.',
      { opponent, challenger, amount }
    )
  )
}

async function accept(ctx: LoyaltyGameContext): Promise<void> {
  const opponent = cleanLogin(ctx.userLogin)
  const pending = pendingMatches.get(opponent)
  if (!pending || pending.expiresAt < Date.now()) {
    pendingMatches.delete(opponent)
    await ctx.reply(
      ctx.text('noPending', '@{user} Keine offene SSP-Herausforderung.', { user: opponent })
    )
    return
  }

  const challengerAccount = getOrCreateAccount(pending.challenger)
  const opponentAccount = getOrCreateAccount(opponent)
  if (challengerAccount.balance < pending.amount || opponentAccount.balance < pending.amount) {
    pendingMatches.delete(opponent)
    await ctx.reply(
      ctx.text(
        'insufficientFunds',
        '@{user} SSP abgebrochen -- nicht genug Punkte bei einem Teilnehmer.',
        {
          user: opponent
        }
      )
    )
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

  try {
    await Promise.all([
      ctx.whisper(
        pending.challenger,
        ctx.text(
          'privateOptions',
          'SSP gegen @{opponent}: Antworte mit !ssp 1, !ssp 2 oder !ssp 3. Deine Zuordnung: {mapping}.',
          { opponent, mapping: formatMapping(match.mappings[pending.challenger]) }
        )
      ),
      ctx.whisper(
        opponent,
        ctx.text(
          'privateOptions',
          'SSP gegen @{opponent}: Antworte mit !ssp 1, !ssp 2 oder !ssp 3. Deine Zuordnung: {mapping}.',
          { opponent: pending.challenger, mapping: formatMapping(match.mappings[opponent]) }
        )
      )
    ])
  } catch (error) {
    logger.error('SSP abgebrochen: Private Optionen konnten nicht zugestellt werden', error)
    activeMatches.delete(matchKey(pending.challenger, opponent))
    await ctx.reply(
      ctx.text(
        'privateDeliveryFailed',
        '@{challenger} @{opponent} SSP abgebrochen -- private Optionen konnten nicht zugestellt werden.',
        { challenger: pending.challenger, opponent }
      )
    )
    return
  }
  await ctx.reply(
    ctx.text(
      'accepted',
      'SSP zwischen @{challenger} und @{opponent} wurde angenommen. Beide haben ihre Optionen privat erhalten.',
      { challenger: pending.challenger, opponent }
    )
  )
}

async function choose(ctx: LoyaltyGameContext, config: SspConfig): Promise<void> {
  const login = cleanLogin(ctx.userLogin)
  const choice = Number(ctx.args[0])
  if (choice !== 1 && choice !== 2 && choice !== 3) return

  const match = findActiveMatch(login)
  if (!match) {
    await ctx.whisper(login, ctx.text('noActive', 'Du hast gerade kein aktives SSP-Spiel.'))
    return
  }
  if (match.choices.has(login)) {
    await ctx.whisper(
      login,
      ctx.text('alreadyChosen', 'Deine SSP-Auswahl wurde bereits gespeichert.')
    )
    return
  }

  const move = match.mappings[login][choice]
  match.choices.set(login, move)
  await ctx.whisper(
    login,
    ctx.text('choiceSaved', 'Auswahl gespeichert: {choice}. Warte auf den anderen Spieler.', {
      choice
    })
  )

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
      ctx.text(
        'draw',
        'SSP endet unentschieden: @{challenger} ({challengerMove}) gegen @{opponent} ({opponentMove}).',
        {
          challenger: match.challenger,
          challengerMove,
          opponent: match.opponent,
          opponentMove
        }
      )
    )
    return
  }

  const loser = winner === match.challenger ? match.opponent : match.challenger
  try {
    debitLoyalty(loser, match.amount, 'game_loss', 'ssp')
    creditLoyalty(winner, match.amount, 'game_win', 'ssp')
  } catch {
    await ctx.reply(
      ctx.text(
        'payoutFailed',
        'SSP abgebrochen -- Punkte konnten beim Abschluss nicht gebucht werden.'
      )
    )
    return
  }

  await ctx.reply(
    ctx.text(
      'result',
      'SSP entschieden: @{winner} gewinnt {amount} Punkte! @{challenger} ({challengerMove}) gegen @{opponent} ({opponentMove}).',
      {
        winner,
        amount: match.amount,
        challenger: match.challenger,
        challengerMove,
        opponent: match.opponent,
        opponentMove
      }
    )
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
  cancelPendingRequests: cancelPendingSspMatches,
  defaultTexts: {
    usage: ['@{user} Nutzung: !ssp @user <Punkte|all|xx%>'],
    selfChallenge: ['@{user} Du kannst nicht gegen dich selbst spielen.'],
    alreadyPlaying: ['@{user} Einer von euch spielt bereits Schere Stein Papier.'],
    challenge: [
      '@{opponent} wurde von @{challenger} zu Schere Stein Papier um {amount} Punkte herausgefordert. Mit !ssp accept annehmen. @{challenger} kann mit !cancel abbrechen.'
    ],
    noPending: ['@{user} Keine offene SSP-Herausforderung.'],
    insufficientFunds: ['@{user} SSP abgebrochen -- nicht genug Punkte bei einem Teilnehmer.'],
    privateOptions: [
      'SSP gegen @{opponent}: Antworte mit !ssp 1, !ssp 2 oder !ssp 3. Deine Zuordnung: {mapping}.'
    ],
    accepted: [
      'SSP zwischen @{challenger} und @{opponent} wurde angenommen. Beide haben ihre Optionen privat erhalten.'
    ],
    privateDeliveryFailed: [
      '@{challenger} @{opponent} SSP abgebrochen -- private Optionen konnten nicht zugestellt werden.'
    ],
    noActive: ['Du hast gerade kein aktives SSP-Spiel.'],
    alreadyChosen: ['Deine SSP-Auswahl wurde bereits gespeichert.'],
    choiceSaved: ['Auswahl gespeichert: {choice}. Warte auf den anderen Spieler.'],
    draw: [
      'SSP endet unentschieden: @{challenger} ({challengerMove}) gegen @{opponent} ({opponentMove}).'
    ],
    payoutFailed: ['SSP abgebrochen -- Punkte konnten beim Abschluss nicht gebucht werden.'],
    result: [
      'SSP entschieden: @{winner} gewinnt {amount} Punkte! @{challenger} ({challengerMove}) gegen @{opponent} ({opponentMove}).'
    ]
  },
  commands: [{ key: 'play', defaultTrigger: '!ssp', handleCommand: handleSsp }]
}
