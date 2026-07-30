import type { LoyaltyGame } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { parseBetAmount } from './betParser'
import { placeBet } from './rouletteScheduler'
import type { RouletteColor } from './rouletteScheduler'

interface RouletteConfig {
  roundIntervalSeconds: number
  minBet: number
  maxBet: number
  greenPayoutMultiplier: number
}

const VALID_COLORS: readonly RouletteColor[] = ['rot', 'schwarz', 'gruen']

function parseColor(raw: string | undefined): RouletteColor | null {
  const lower = raw?.toLowerCase()
  return VALID_COLORS.includes(lower as RouletteColor) ? (lower as RouletteColor) : null
}

export const rouletteGame: LoyaltyGame = {
  id: 'roulette',
  commandTrigger: '!roulette',
  defaultConfig: {
    roundIntervalSeconds: 60,
    minBet: 10,
    maxBet: 0,
    greenPayoutMultiplier: 14
  } satisfies RouletteConfig,

  async handleCommand(ctx) {
    const config = ctx.config as unknown as RouletteConfig
    const color = parseColor(ctx.args[0])
    const account = getOrCreateAccount(ctx.userLogin)
    const amount = parseBetAmount(ctx.args[1], account.balance, config.minBet, config.maxBet)

    if (!color || amount === null) {
      await ctx.reply(
        `@${ctx.userLogin} Nutzung: !roulette <rot|schwarz|gruen> <Einsatz|all|xx%> -- nur eine Farbe pro Runde!`
      )
      return
    }

    const result = placeBet(ctx.userLogin, color, amount)
    if (!result.ok) {
      await ctx.reply(`@${ctx.userLogin} ${result.reason}`)
      return
    }

    await ctx.reply(
      `@${ctx.userLogin} Wette auf ${color.toUpperCase()} mit ${amount} Punkten platziert!`
    )
  }
}
