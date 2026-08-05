export type BuiltInLoyaltyCommand =
  | 'points'
  | 'rank'
  | 'givePoints'
  | 'pointsAdmin'
  | 'cancelGames'
  | 'commandList'

export const LOYALTY_COMMAND_TRIGGERS: Record<BuiltInLoyaltyCommand, readonly string[]> = {
  points: ['!punkte', '!points'],
  rank: ['!rang', '!rank'],
  givePoints: ['!givepoints', '!punktegeben'],
  pointsAdmin: ['!punkteadmin', '!pointsadmin'],
  cancelGames: ['!cancel', '!abbrechen'],
  commandList: ['!commands', '!befehle', '!help', '!hilfe']
}

const TRIGGERS = LOYALTY_COMMAND_TRIGGERS

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
