import type { LoyaltyGame, LoyaltyGameContext } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { creditLoyalty } from '../loyaltyLedger'
import { parseBetAmount } from './betParser'

interface GambleConfig {
  winChancePercent: number
  minBet: number
  maxBet: number
}

async function handleBet(ctx: LoyaltyGameContext): Promise<void> {
  const config = ctx.config as unknown as GambleConfig
  const account = getOrCreateAccount(ctx.userLogin)
  const amount = parseBetAmount(ctx.args[0], account.balance, config.minBet, config.maxBet)

  if (amount === null) {
    const limit = config.maxBet > 0 ? `${config.minBet}-${config.maxBet}` : `ab ${config.minBet}`
    await ctx.reply(
      `@${ctx.userLogin} Nutzung: !gamble <Einsatz|all|xx%> (${limit}, max. Kontostand: ${account.balance})`
    )
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

export const gambleGame: LoyaltyGame = {
  id: 'gamble',
  defaultConfig: { winChancePercent: 45, minBet: 10, maxBet: 1000 } satisfies GambleConfig,
  commands: [{ key: 'bet', defaultTrigger: '!gamble', handleCommand: handleBet }]
}
