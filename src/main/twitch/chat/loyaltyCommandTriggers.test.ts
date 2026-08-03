import { describe, expect, it } from 'vitest'
import { resolveBuiltInLoyaltyCommand } from './loyaltyCommandTriggers'

describe('resolveBuiltInLoyaltyCommand', () => {
  it.each([
    ['!punkte', 'points'],
    ['!points', 'points'],
    ['!rang', 'rank'],
    ['!rank', 'rank'],
    ['!punkteadmin', 'pointsAdmin'],
    ['!pointsadmin', 'pointsAdmin']
  ] as const)('maps %s to %s', (trigger, command) => {
    expect(resolveBuiltInLoyaltyCommand(trigger)).toBe(command)
  })

  it('does not treat the personal points command as an admin command', () => {
    expect(resolveBuiltInLoyaltyCommand('!punkte')).not.toBe('pointsAdmin')
  })
})
