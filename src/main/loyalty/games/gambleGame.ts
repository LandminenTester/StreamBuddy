import type { LoyaltyGame, LoyaltyGameContext } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { creditLoyalty } from '../loyaltyLedger'
import { parseBetAmount } from './betParser'

interface GambleConfig {
  winChancePercent: number
  cooldownSeconds: number
  minBet: number
  maxBet: number
}

const lastGambleAt = new Map<string, number>()

async function handleBet(ctx: LoyaltyGameContext): Promise<void> {
  const config = ctx.config as unknown as GambleConfig
  const login = ctx.userLogin.toLowerCase()
  const lastUsed = lastGambleAt.get(login) ?? 0
  const remainingSeconds = Math.ceil((lastUsed + config.cooldownSeconds * 1000 - Date.now()) / 1000)
  if (remainingSeconds > 0) {
    await ctx.reply(
      ctx.text('cooldown', '@{user} Gamble-Cooldown: noch {seconds}s warten.', {
        user: ctx.userLogin,
        seconds: remainingSeconds
      })
    )
    return
  }

  const account = getOrCreateAccount(ctx.userLogin)
  const amount = parseBetAmount(ctx.args[0], account.balance, config.minBet, config.maxBet)

  if (amount === null) {
    const limit = config.maxBet > 0 ? `${config.minBet}-${config.maxBet}` : `ab ${config.minBet}`
    await ctx.reply(
      ctx.text(
        'usage',
        '@{user} Nutzung: !gamble <Einsatz|all|xx%> ({limit}, max. Kontostand: {balance})',
        { user: ctx.userLogin, limit, balance: account.balance }
      )
    )
    return
  }

  const won = Math.random() * 100 < config.winChancePercent
  lastGambleAt.set(login, Date.now())

  if (won) {
    creditLoyalty(ctx.userLogin, amount, 'game_win', 'gamble')
    await ctx.reply(
      ctx.text('win', '@{user} Gewonnen! +{amount} Punkte.', {
        user: ctx.userLogin,
        amount
      })
    )
  } else {
    creditLoyalty(ctx.userLogin, -amount, 'game_loss', 'gamble')
    await ctx.reply(
      ctx.text('loss', '@{user} Verloren. -{amount} Punkte.', {
        user: ctx.userLogin,
        amount
      })
    )
  }
}

export const gambleGame: LoyaltyGame = {
  id: 'gamble',
  defaultConfig: {
    winChancePercent: 45,
    cooldownSeconds: 30,
    minBet: 10,
    maxBet: 1000
  } satisfies GambleConfig,
  defaultTexts: {
    cooldown: ['@{user} Gamble-Cooldown: noch {seconds}s warten.'],
    usage: ['@{user} Nutzung: !gamble <Einsatz|all|xx%> ({limit}, max. Kontostand: {balance})'],
    win: ['@{user} Gewonnen! +{amount} Punkte.'],
    loss: ['@{user} Verloren. -{amount} Punkte.']
  },
  commands: [{ key: 'bet', defaultTrigger: '!gamble', handleCommand: handleBet }]
}
