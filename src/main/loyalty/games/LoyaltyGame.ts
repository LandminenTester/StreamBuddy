export interface LoyaltyGameContext {
  userLogin: string
  args: string[]
  reply: (message: string) => Promise<void>
  config: Record<string, unknown>
}

/**
 * Ein einzelner, in der App umbenennbarer Chat-Befehl eines Games (z.B. 'bet' bei
 * Gamble, 'red'/'black'/'green'/'stats' bei Roulette). `defaultTrigger` greift nur,
 * solange kein Override in loyalty_games_config.command_triggers gespeichert ist
 * (siehe gameRegistry.ts).
 */
export interface LoyaltyGameCommand {
  key: string
  defaultTrigger: string
  handleCommand(ctx: LoyaltyGameContext): Promise<void>
}

/**
 * Generisches Plugin-Interface für Loyalty-Games. Neue Spiele werden als weitere
 * Datei in games/ ergänzt und in gameRegistry.ts registriert, ohne Core-Änderungen
 * an Ledger oder commandRouter.
 */
export interface LoyaltyGame {
  id: string
  commands: LoyaltyGameCommand[]
  defaultConfig: Record<string, unknown>
  /** Default-Ansagetext-Varianten pro Text-Slot (z.B. 'roundStart'), überschreibbar via texts-Spalte. */
  defaultTexts?: Record<string, string[]>
}
