import type { RouletteColor } from '@shared/types/roulette'
import type { LoyaltyGame, LoyaltyGameCommand, LoyaltyGameContext } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { listRecentRouletteColors } from '../../db/repositories/rouletteRounds.repo'
import { parseBetAmount } from './betParser'
import {
  getCurrentRouletteBetAmount,
  placeBet,
  placeNumberBet,
  COLOR_EMOJI
} from './rouletteScheduler'
import { BOT_TEXTS } from '../botTexts'

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

async function placeColorBet(ctx: LoyaltyGameContext, color: RouletteColor): Promise<void> {
  const config = ctx.config as unknown as RouletteConfig
  const account = getOrCreateAccount(ctx.userLogin)
  const availableBalance = Math.max(0, account.balance - getCurrentRouletteBetAmount(ctx.userLogin))
  const amount = parseBetAmount(ctx.args[0], availableBalance, config.minBet, config.maxBet)

  if (amount === null) {
    const limit = config.maxBet > 0 ? `${config.minBet}-${config.maxBet}` : `ab ${config.minBet}`
    await ctx.reply(
      `@${ctx.userLogin} Nutzung: !${color} <Einsatz|all|xx%> (${limit}, verfuegbar: ${availableBalance})`
    )
    return
  }

  const result = placeBet(ctx.userLogin, color, amount)
  if (!result.ok) {
    await ctx.reply(`@${ctx.userLogin} ${result.reason}`)
    return
  }

  await ctx.reply(
    `@${ctx.userLogin} Wette auf ${color.toUpperCase()} mit ${amount} Punkten platziert! Gesamt: ${result.totalAmount}.`
  )
}

async function handleNumberBet(ctx: LoyaltyGameContext): Promise<void> {
  const config = ctx.config as unknown as RouletteConfig
  const account = getOrCreateAccount(ctx.userLogin)
  const number = Number(ctx.args[0])
  const availableBalance = Math.max(0, account.balance - getCurrentRouletteBetAmount(ctx.userLogin))
  const amount = parseBetAmount(ctx.args[1], availableBalance, config.minBet, config.maxBet)

  if (!Number.isInteger(number) || number < 0 || number > 36 || amount === null) {
    const limit = config.maxBet > 0 ? `${config.minBet}-${config.maxBet}` : `ab ${config.minBet}`
    await ctx.reply(
      `@${ctx.userLogin} Nutzung: !number <0-36> <Einsatz|all|xx%> (${limit}, verfuegbar: ${availableBalance})`
    )
    return
  }

  const result = placeNumberBet(ctx.userLogin, number, amount)
  if (!result.ok) {
    await ctx.reply(`@${ctx.userLogin} ${result.reason}`)
    return
  }

  await ctx.reply(
    `@${ctx.userLogin} Wette auf ${number} mit ${amount} Punkten platziert! Gesamt: ${result.totalAmount}.`
  )
}

async function handleStats(ctx: LoyaltyGameContext): Promise<void> {
  const rounds = listRecentRouletteColors(20)
  if (rounds.length === 0) {
    await ctx.reply(`@${ctx.userLogin} Noch keine Roulette-Runden gespielt.`)
    return
  }
  const sequence = rounds
    .map((round) => `${round.number ?? '?'}${COLOR_EMOJI[round.color]}`)
    .join(' ')
  await ctx.reply(`@${ctx.userLogin} Letzte ${rounds.length} Runden (neueste zuerst): ${sequence}`)
}

const commands: LoyaltyGameCommand[] = [
  { key: 'red', defaultTrigger: '!red', handleCommand: (ctx) => placeColorBet(ctx, 'rot') },
  { key: 'black', defaultTrigger: '!black', handleCommand: (ctx) => placeColorBet(ctx, 'schwarz') },
  { key: 'green', defaultTrigger: '!green', handleCommand: (ctx) => placeColorBet(ctx, 'gruen') },
  { key: 'number', defaultTrigger: '!number', handleCommand: handleNumberBet },
  { key: 'stats', defaultTrigger: '!roulettestats', handleCommand: handleStats }
]

export const rouletteGame: LoyaltyGame = {
  id: 'roulette',
  commands,
  defaultConfig: {
    bettingWindowSeconds: 60,
    roundCooldownSeconds: 60,
    spinDelayMinSeconds: 10,
    spinDelayMaxSeconds: 15,
    minBet: 10,
    maxBet: 0,
    greenPayoutMultiplier: 14,
    numberPayoutMultiplier: 14
  } satisfies RouletteConfig,
  // Master-Sprache Deutsch; die tatsaechlich genutzten Texte legt der Setup-Wizard
  // in der gewaehlten Sprache in der DB ab (siehe botTexts.ts).
  defaultTexts: BOT_TEXTS.de.gameTexts.roulette
}
