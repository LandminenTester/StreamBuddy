import type { CancelledGameRequest, LoyaltyGame, LoyaltyGameContext } from './LoyaltyGame'
import { getOrCreateAccount, insertDuelMatch } from '../../db/repositories/loyalty.repo'
import { creditLoyalty, debitLoyalty } from '../loyaltyLedger'
import { parseBetAmount } from './betParser'
import { resolveCommandTrigger } from './gameRegistry'

interface DuelConfig {
  acceptWindowSeconds: number
  minBet: number
  maxBet: number
}

interface PendingDuel {
  challenger: string
  amount: number
  expiresAt: number
}

/** Offene Duell-Anfragen, keyed by Login des herausgeforderten Gegners. */
const pendingDuels = new Map<string, PendingDuel>()

function cancelPendingDuels(userLogin: string): CancelledGameRequest[] {
  const challenger = userLogin.trim().toLowerCase()
  const now = Date.now()
  const cancelled: CancelledGameRequest[] = []

  for (const [opponent, pending] of pendingDuels) {
    if (pending.challenger.toLowerCase() !== challenger) continue
    pendingDuels.delete(opponent)
    if (pending.expiresAt >= now) cancelled.push({ gameId: 'duel', opponent })
  }
  return cancelled
}

async function handleChallenge(ctx: LoyaltyGameContext): Promise<void> {
  const config = ctx.config as unknown as DuelConfig
  await challengeDuel(ctx, config)
}

export const duelGame: LoyaltyGame = {
  id: 'duel',
  defaultConfig: { acceptWindowSeconds: 60, minBet: 10, maxBet: 1000 } satisfies DuelConfig,
  cancelPendingRequests: cancelPendingDuels,
  defaultTexts: {
    usage: ['@{user} Nutzung: !duel @user <Einsatz|all|xx%>'],
    selfChallenge: ['@{user} Du kannst nicht gegen dich selbst antreten.'],
    challenge: [
      '@{opponent} wurde von @{challenger} zu einem Duell um {amount} Punkte herausgefordert! Mit "{acceptTrigger}" annehmen ({seconds}s Zeit). @{challenger} kann mit !cancel abbrechen.'
    ],
    noPending: ['@{user} Keine offene Duell-Anfrage.'],
    insufficientFunds: [
      '@{user} Duell abgebrochen -- nicht genug Punkte bei einem der Teilnehmer.'
    ],
    result: ['Duell entschieden: @{winner} gewinnt {amount} Punkte von @{loser}!']
  },
  commands: [
    { key: 'challenge', defaultTrigger: '!duel', handleCommand: handleChallenge },
    { key: 'accept', defaultTrigger: '!accept', handleCommand: acceptDuel }
  ]
}

async function challengeDuel(ctx: LoyaltyGameContext, config: DuelConfig): Promise<void> {
  const opponentLogin = ctx.args[0]?.replace('@', '').toLowerCase()
  const challengerAccount = getOrCreateAccount(ctx.userLogin)
  const amount = parseBetAmount(
    ctx.args[1],
    challengerAccount.balance,
    config.minBet,
    config.maxBet
  )

  if (!opponentLogin || amount === null) {
    await ctx.reply(
      ctx.text('usage', '@{user} Nutzung: !duel @user <Einsatz|all|xx%>', { user: ctx.userLogin })
    )
    return
  }
  if (opponentLogin === ctx.userLogin.toLowerCase()) {
    await ctx.reply(
      ctx.text('selfChallenge', '@{user} Du kannst nicht gegen dich selbst antreten.', {
        user: ctx.userLogin
      })
    )
    return
  }

  pendingDuels.set(opponentLogin, {
    challenger: ctx.userLogin,
    amount,
    expiresAt: Date.now() + config.acceptWindowSeconds * 1000
  })

  const acceptCommand = duelGame.commands.find((c) => c.key === 'accept')!
  const acceptTrigger = resolveCommandTrigger('duel', acceptCommand)
  await ctx.reply(
    ctx.text(
      'challenge',
      '@{opponent} wurde von @{challenger} zu einem Duell um {amount} Punkte herausgefordert! Mit "{acceptTrigger}" annehmen ({seconds}s Zeit). @{challenger} kann mit !cancel abbrechen.',
      {
        opponent: opponentLogin,
        challenger: ctx.userLogin,
        amount,
        acceptTrigger,
        seconds: config.acceptWindowSeconds
      }
    )
  )
}

async function acceptDuel(ctx: LoyaltyGameContext): Promise<void> {
  const opponentLogin = ctx.userLogin.toLowerCase()
  const pending = pendingDuels.get(opponentLogin)

  if (!pending || pending.expiresAt < Date.now()) {
    pendingDuels.delete(opponentLogin)
    await ctx.reply(
      ctx.text('noPending', '@{user} Keine offene Duell-Anfrage.', { user: ctx.userLogin })
    )
    return
  }
  pendingDuels.delete(opponentLogin)

  const challengerAccount = getOrCreateAccount(pending.challenger)
  const opponentAccount = getOrCreateAccount(ctx.userLogin)

  if (challengerAccount.balance < pending.amount || opponentAccount.balance < pending.amount) {
    await ctx.reply(
      ctx.text(
        'insufficientFunds',
        '@{user} Duell abgebrochen -- nicht genug Punkte bei einem der Teilnehmer.',
        { user: ctx.userLogin }
      )
    )
    return
  }

  const challengerWins = Math.random() < 0.5
  const winner = challengerWins ? pending.challenger : ctx.userLogin
  const loser = challengerWins ? ctx.userLogin : pending.challenger

  creditLoyalty(winner, pending.amount, 'game_win', 'duel')
  debitLoyalty(loser, pending.amount, 'game_loss', 'duel')
  insertDuelMatch({
    challengerLogin: pending.challenger.toLowerCase(),
    opponentLogin,
    winnerLogin: winner.toLowerCase(),
    loserLogin: loser.toLowerCase(),
    amount: pending.amount
  })

  await ctx.reply(
    ctx.text('result', 'Duell entschieden: @{winner} gewinnt {amount} Punkte von @{loser}!', {
      winner,
      amount: pending.amount,
      loser
    })
  )
}
