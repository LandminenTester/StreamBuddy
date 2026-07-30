import type { LoyaltyGame } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { creditLoyalty } from '../loyaltyLedger'

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

export const duelGame: LoyaltyGame = {
  id: 'duel',
  commandTrigger: '!duel',
  defaultConfig: { acceptWindowSeconds: 60, minBet: 10, maxBet: 1000 } satisfies DuelConfig,

  async handleCommand(ctx) {
    const config = ctx.config as unknown as DuelConfig

    if (ctx.args[0]?.toLowerCase() === 'accept') {
      await acceptDuel(ctx)
      return
    }

    await challengeDuel(ctx, config)
  }
}

async function challengeDuel(
  ctx: Parameters<LoyaltyGame['handleCommand']>[0],
  config: DuelConfig
): Promise<void> {
  const opponentLogin = ctx.args[0]?.replace('@', '').toLowerCase()
  const amount = Number(ctx.args[1])

  if (
    !opponentLogin ||
    !Number.isInteger(amount) ||
    amount < config.minBet ||
    amount > config.maxBet
  ) {
    await ctx.reply(`@${ctx.userLogin} Nutzung: !duel @user <Einsatz>`)
    return
  }
  if (opponentLogin === ctx.userLogin.toLowerCase()) {
    await ctx.reply(`@${ctx.userLogin} Du kannst nicht gegen dich selbst antreten.`)
    return
  }

  const challengerAccount = getOrCreateAccount(ctx.userLogin)
  if (challengerAccount.balance < amount) {
    await ctx.reply(`@${ctx.userLogin} Nicht genug Punkte für diesen Einsatz.`)
    return
  }

  pendingDuels.set(opponentLogin, {
    challenger: ctx.userLogin,
    amount,
    expiresAt: Date.now() + config.acceptWindowSeconds * 1000
  })

  await ctx.reply(
    `@${opponentLogin} wurde von @${ctx.userLogin} zu einem Duell um ${amount} Punkte herausgefordert! ` +
      `Mit "!duel accept" annehmen (${config.acceptWindowSeconds}s Zeit).`
  )
}

async function acceptDuel(ctx: Parameters<LoyaltyGame['handleCommand']>[0]): Promise<void> {
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
