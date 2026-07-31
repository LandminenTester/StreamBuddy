import type { RouletteColor } from '@shared/types/roulette'
import type { LoyaltyGame, LoyaltyGameCommand, LoyaltyGameContext } from './LoyaltyGame'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import { listRecentRouletteColors } from '../../db/repositories/rouletteRounds.repo'
import { parseBetAmount } from './betParser'
import { placeBet } from './rouletteScheduler'

interface RouletteConfig {
  bettingWindowSeconds: number
  spinDelayMinSeconds: number
  spinDelayMaxSeconds: number
  minBet: number
  maxBet: number
  greenPayoutMultiplier: number
}

const COLOR_EMOJI: Record<RouletteColor, string> = { rot: '🔴', schwarz: '⚫', gruen: '🟢' }

async function placeColorBet(ctx: LoyaltyGameContext, color: RouletteColor): Promise<void> {
  const config = ctx.config as unknown as RouletteConfig
  const account = getOrCreateAccount(ctx.userLogin)
  const amount = parseBetAmount(ctx.args[0], account.balance, config.minBet, config.maxBet)

  if (amount === null) {
    const limit = config.maxBet > 0 ? `${config.minBet}-${config.maxBet}` : `ab ${config.minBet}`
    await ctx.reply(
      `@${ctx.userLogin} Nutzung: !${color} <Einsatz|all|xx%> (${limit}, max. Kontostand: ${account.balance})`
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

async function handleStats(ctx: LoyaltyGameContext): Promise<void> {
  const colors = listRecentRouletteColors(20)
  if (colors.length === 0) {
    await ctx.reply(`@${ctx.userLogin} Noch keine Roulette-Runden gespielt.`)
    return
  }
  const sequence = colors.map((color) => COLOR_EMOJI[color]).join('')
  await ctx.reply(`@${ctx.userLogin} Letzte ${colors.length} Farben (neueste zuerst): ${sequence}`)
}

const commands: LoyaltyGameCommand[] = [
  { key: 'red', defaultTrigger: '!red', handleCommand: (ctx) => placeColorBet(ctx, 'rot') },
  { key: 'black', defaultTrigger: '!black', handleCommand: (ctx) => placeColorBet(ctx, 'schwarz') },
  { key: 'green', defaultTrigger: '!green', handleCommand: (ctx) => placeColorBet(ctx, 'gruen') },
  { key: 'stats', defaultTrigger: '!roulettestats', handleCommand: handleStats }
]

export const rouletteGame: LoyaltyGame = {
  id: 'roulette',
  commands,
  defaultConfig: {
    bettingWindowSeconds: 60,
    spinDelayMinSeconds: 10,
    spinDelayMaxSeconds: 15,
    minBet: 10,
    maxBet: 0,
    greenPayoutMultiplier: 14
  } satisfies RouletteConfig,
  defaultTexts: {
    roundStart: [
      '🎡 Neue Roulette-Runde! {seconds}s Zeit zum Setzen: !red / !black / !green <Einsatz|all|xx%> -- nur eine Farbe pro Runde!',
      '🎲 Setzt eure Punkte! {seconds}s bis die Kugel rollt -- !red, !black oder !green, nur eine Farbe erlaubt.',
      '🎰 Runde eröffnet! {seconds}s Wettfenster: !red / !black / !green <Einsatz>. Grün zahlt am meisten, aber am seltensten!'
    ],
    spinning: [
      '🎡 Die Kugel rollt und dreht sich...',
      '🌀 Alles auf Rot, Schwarz oder Grün? Die Kugel läuft...',
      '🎲 Und sie dreht sich... gleich ist es soweit!'
    ],
    result: [
      '🎉 {color} gewinnt! {winners}/{total} Wetten haben gewonnen.',
      '🏆 Die Kugel landet auf {color}! {winners}/{total} Gewinner.',
      '🎊 Es ist {color}! {winners} von {total} Wetten waren richtig.'
    ]
  }
}
