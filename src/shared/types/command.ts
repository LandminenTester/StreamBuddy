export type PermissionLevel = 'everyone' | 'subscriber' | 'moderator' | 'broadcaster'

/**
 * Wie die Command-Antwort zugestellt wird: öffentlich im Chat, als Erwähnung
 * (öffentlich, aber sichtbar an den Aufrufer gerichtet) oder als Whisper (privat).
 * Whisper hängt von Twitch-seitigen Einschränkungen für den Bot-Account ab.
 */
export type CommandDeliveryMode = 'public' | 'mention' | 'whisper'
export type CommandTrackerActionType = 'increment' | 'decrement'

export interface CommandTrackerAction {
  trackerId: number
  action: CommandTrackerActionType
}

export interface Command {
  id: number
  trigger: string
  response: string
  aliases: string[]
  permissionLevel: PermissionLevel
  cooldownSeconds: number
  deliveryMode: CommandDeliveryMode
  enabled: boolean
  useCount: number
  createdAt: number
  updatedAt: number
  trackerId: number | null
  trackerAction: CommandTrackerActionType | null
  trackerActions: CommandTrackerAction[]
}

export type CommandInput = Omit<
  Command,
  'id' | 'useCount' | 'createdAt' | 'updatedAt' | 'trackerActions'
> & {
  trackerActions?: CommandTrackerAction[]
}

/** Vom Bot fest vorgegebener Command (Loyalty-Kern oder Spiel) -- getrennt von Custom-Commands. */
export interface BuiltInCommandInfo {
  /** Eindeutiger Schluessel, z.B. 'points' oder 'roulette.red'. */
  key: string
  /** Alle Trigger-Aliase (Loyalty-Kern) bzw. der aktuell wirksame Trigger (Spiele). */
  triggers: string[]
  scope: 'loyalty' | 'game'
  /** Nur bei scope 'game' gesetzt. */
  gameId?: string
  enabled: boolean
  /** True, wenn das Spiel dahinter wegen einer Twitch-API-Einschraenkung nicht nutzbar ist. */
  temporarilyUnavailable: boolean
}
