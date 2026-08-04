import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LoyaltyGameContext } from './LoyaltyGame'
import { rouletteGame } from './rouletteGame'
import {
  getCurrentRouletteBetAmount,
  placeBet,
  placeNumberBet
} from './rouletteScheduler'

vi.mock('../../db/repositories/loyalty.repo', () => ({
  getOrCreateAccount: vi.fn((userLogin: string) => ({
    id: 1,
    userLogin,
    balance: 100,
    totalEarned: 100,
    totalWagered: 0,
    lastSeenAt: null,
    isBlacklisted: false
  }))
}))

vi.mock('../../db/repositories/rouletteRounds.repo', () => ({
  listRecentRouletteColors: vi.fn(() => [])
}))

vi.mock('./rouletteScheduler', () => ({
  getCurrentRouletteBetAmount: vi.fn(() => 0),
  placeBet: vi.fn(() => ({ ok: true, totalAmount: 100 })),
  placeNumberBet: vi.fn(() => ({ ok: true, totalAmount: 100 })),
  COLOR_EMOJI: { rot: '', schwarz: '', gruen: '' }
}))

vi.mock('../botTexts', () => ({
  BOT_TEXTS: { de: { gameTexts: { roulette: {} } } }
}))

function context(args: string[]): LoyaltyGameContext {
  return {
    userLogin: 'alice',
    args,
    reply: vi.fn(async () => undefined),
    whisper: vi.fn(async () => undefined),
    config: {
      bettingWindowSeconds: 60,
      roundCooldownSeconds: 60,
      spinDelayMinSeconds: 10,
      spinDelayMaxSeconds: 15,
      minBet: 10,
      maxBet: 0,
      greenPayoutMultiplier: 14,
      numberPayoutMultiplier: 14
    },
    text: (_slot, fallback, values = {}) =>
      Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
        fallback
      )
  }
}

describe('roulette commands', () => {
  beforeEach(() => {
    vi.mocked(getCurrentRouletteBetAmount).mockReturnValue(0)
    vi.mocked(placeBet).mockClear()
    vi.mocked(placeNumberBet).mockClear()
  })

  it('treats all as the remaining available balance when increasing an existing color bet', async () => {
    vi.mocked(getCurrentRouletteBetAmount).mockReturnValue(60)

    const blackCommand = rouletteGame.commands.find((command) => command.key === 'black')!
    await blackCommand.handleCommand(context(['all']))

    expect(placeBet).toHaveBeenCalledWith('alice', 'schwarz', 40)
  })

  it('treats percentages as a share of the remaining available balance', async () => {
    vi.mocked(getCurrentRouletteBetAmount).mockReturnValue(60)

    const blackCommand = rouletteGame.commands.find((command) => command.key === 'black')!
    await blackCommand.handleCommand(context(['50%']))

    expect(placeBet).toHaveBeenCalledWith('alice', 'schwarz', 20)
  })
})
