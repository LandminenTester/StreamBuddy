import type { LoyaltyGame } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { creditLoyalty } from '../loyaltyLedger'

interface GambleConfig {
  winChancePercent: number
  minBet: number
  maxBet: number
}

export const gambleGame: LoyaltyGame = {
  id: 'gamble',
  commandTrigger: '!gamble',
  defaultConfig: { winChancePercent: 45, minBet: 10, maxBet: 1000 } satisfies GambleConfig,

  async handleCommand(ctx) {
    const config = ctx.config as unknown as GambleConfig
    const amount = Number(ctx.args[0])

    if (!Number.isInteger(amount) || amount < config.minBet || amount > config.maxBet) {
      await ctx.reply(
        `@${ctx.userLogin} Nutzung: !gamble <Einsatz> (${config.minBet}-${config.maxBet})`
      )
      return
    }

    const account = getOrCreateAccount(ctx.userLogin)
    if (account.balance < amount) {
      await ctx.reply(`@${ctx.userLogin} Nicht genug Punkte (Kontostand: ${account.balance}).`)
      return
    }

    const won = Math.random() * 100 < config.winChancePercent

    if (won) {
      creditLoyalty(ctx.userLogin, amount, 'game_win', 'gamble')
      await ctx.reply(`@${ctx.userLogin} Gewonnen! +${amount} Punkte.`)
    } else {
      creditLoyalty(ctx.userLogin, -amount, 'game_loss', 'gamble')
      await ctx.reply(`@${ctx.userLogin} Verloren. -${amount} Punkte.`)
    }
  }
}
