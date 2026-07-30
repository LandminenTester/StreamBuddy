export interface LoyaltyGameContext {
  userLogin: string
  args: string[]
  reply: (message: string) => Promise<void>
  config: Record<string, unknown>
}

/**
 * Generisches Plugin-Interface für Loyalty-Games. Neue Spiele werden als weitere
 * Datei in games/ ergänzt und in gameRegistry.ts registriert, ohne Core-Änderungen
 * an Ledger oder commandRouter.
 */
export interface LoyaltyGame {
  id: string
  commandTrigger: string
  defaultConfig: Record<string, unknown>
  handleCommand(ctx: LoyaltyGameContext): Promise<void>
}
