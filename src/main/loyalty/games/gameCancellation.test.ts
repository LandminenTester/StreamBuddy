import { describe, expect, it, vi } from 'vitest'
import type { LoyaltyGameContext } from './LoyaltyGame'
import { cancelPendingGameRequests, getGameByTrigger } from './gameRegistry'

vi.mock('../../db/repositories/loyalty.repo', () => ({
  getOrCreateAccount: vi.fn((userLogin: string) => ({
    id: 1,
    userLogin,
    balance: 100,
    totalEarned: 100,
    totalWagered: 0,
    lastSeenAt: null,
    isBlacklisted: false
  })),
  insertDuelMatch: vi.fn(),
  listGameConfigs: vi.fn(() => []),
  seedDefaultGameConfig: vi.fn()
}))

vi.mock('../loyaltyLedger', () => ({
  creditLoyalty: vi.fn(),
  debitLoyalty: vi.fn()
}))

vi.mock('./rouletteScheduler', () => ({
  getCurrentRouletteBetAmount: vi.fn(() => 0),
  placeBet: vi.fn(),
  placeNumberBet: vi.fn(),
  COLOR_EMOJI: { rot: '', schwarz: '', gruen: '' }
}))

vi.mock('../../db/repositories/rouletteRounds.repo', () => ({
  listRecentRouletteColors: vi.fn(() => [])
}))

vi.mock('../botTexts', () => ({
  BOT_TEXTS: { de: { gameTexts: { roulette: {} } } }
}))

function context(userLogin: string, args: string[]): LoyaltyGameContext {
  return {
    userLogin,
    args,
    reply: vi.fn(async () => undefined),
    whisper: vi.fn(async () => undefined),
    config: { acceptWindowSeconds: 60, minBet: 10, maxBet: 1000 },
    text: (_slot, fallback, values = {}) =>
      Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
        fallback
      )
  }
}

describe('cancelPendingGameRequests', () => {
  it('only lets the challenger cancel all of their pending game requests', async () => {
    await getGameByTrigger('!duel')!.command.handleCommand(context('alice', ['@bob', '10']))
    await getGameByTrigger('!ssp')!.command.handleCommand(context('alice', ['@charlie', '10']))

    expect(cancelPendingGameRequests('bob')).toEqual([])
    expect(cancelPendingGameRequests('alice')).toEqual([
      { gameId: 'duel', opponent: 'bob' },
      { gameId: 'ssp', opponent: 'charlie' }
    ])
    expect(cancelPendingGameRequests('alice')).toEqual([])
  })
})
