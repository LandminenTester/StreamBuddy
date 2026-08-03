export type BuiltInLoyaltyCommand = 'points' | 'rank' | 'pointsAdmin' | 'cancelGames'

const TRIGGERS: Record<BuiltInLoyaltyCommand, readonly string[]> = {
  points: ['!punkte', '!points'],
  rank: ['!rang', '!rank'],
  pointsAdmin: ['!punkteadmin', '!pointsadmin'],
  cancelGames: ['!cancel', '!abbrechen']
}

export function resolveBuiltInLoyaltyCommand(trigger: string): BuiltInLoyaltyCommand | null {
  const normalized = trigger.trim().toLowerCase()
  for (const [command, aliases] of Object.entries(TRIGGERS) as [
    BuiltInLoyaltyCommand,
    readonly string[]
  ][]) {
    if (aliases.includes(normalized)) return command
  }
  return null
}
