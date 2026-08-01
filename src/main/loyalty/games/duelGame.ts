import type { LoyaltyGame, LoyaltyGameContext } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { creditLoyalty } from '../loyaltyLedger'
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

async function handleChallenge(ctx: LoyaltyGameContext): Promise<void> {
  const config = ctx.config as unknown as DuelConfig
  await challengeDuel(ctx, config)
}

export const duelGame: LoyaltyGame = {
  id: 'duel',
  defaultConfig: { acceptWindowSeconds: 60, minBet: 10, maxBet: 1000 } satisfies DuelConfig,
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
    await ctx.reply(`@${ctx.userLogin} Nutzung: !duel @user <Einsatz|all|xx%>`)
    return
  }
  if (opponentLogin === ctx.userLogin.toLowerCase()) {
    await ctx.reply(`@${ctx.userLogin} Du kannst nicht gegen dich selbst antreten.`)
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
    `@${opponentLogin} wurde von @${ctx.userLogin} zu einem Duell um ${amount} Punkte herausgefordert! ` +
      `Mit "${acceptTrigger}" annehmen (${config.acceptWindowSeconds}s Zeit).`
  )
}

async function acceptDuel(ctx: LoyaltyGameContext): Promise<void> {
  const opponentLogin = ctx.userLogin.toLowerCase()
  const pending = pendingDuels.get(opponentLogin)

  if (!pending || pending.expiresAt < Date.now()) {
    pendingDuels.delete(opponentLogin)
    await ctx.reply(`@${ctx.userLogin} Keine offene Duell-Anfrage.`)
    return
  }
  pendingDuels.delete(opponentLogin)

  const challengerAccount = getOrCreateAccount(pending.challenger)
  const opponentAccount = getOrCreateAccount(ctx.userLogin)

  if (challengerAccount.balance < pending.amount || opponentAccount.balance < pending.amount) {
    await ctx.reply(
      `@${ctx.userLogin} Duell abgebrochen -- nicht genug Punkte bei einem der Teilnehmer.`
    )
    return
  }

  const challengerWins = Math.random() < 0.5
  const winner = challengerWins ? pending.challenger : ctx.userLogin
  const loser = challengerWins ? ctx.userLogin : pending.challenger

  creditLoyalty(winner, pending.amount, 'game_win', 'duel')
  creditLoyalty(loser, -pending.amount, 'game_loss', 'duel')

  await ctx.reply(`Duell entschieden: @${winner} gewinnt ${pending.amount} Punkte von @${loser}!`)
}
