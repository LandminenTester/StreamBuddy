import type { LoyaltyTransaction, LoyaltyTransactionReason } from '@shared/types/loyalty'
import { applyTransaction, getOrCreateAccount } from '../db/repositories/loyalty.repo'

/**
 * Einzige Schreibstelle für Loyalty-Kontostände. Jede Gutschrift/Abbuchung
 * erzeugt einen Ledger-Eintrag + atomare Balance-Fortschreibung (siehe
 * loyalty.repo.applyTransaction, in einer SQLite-Transaktion).
 */
export function creditLoyalty(
  userLogin: string,
  amount: number,
  reason: LoyaltyTransactionReason,
  gameId: string | null = null
): LoyaltyTransaction {
  const account = getOrCreateAccount(userLogin)
  return applyTransaction(account.id, amount, reason, gameId)
}

/**
 * Abbuchung (z.B. Spieleinsatz). Wirft, falls der Kontostand nicht ausreicht --
 * Aufrufer (Loyalty-Games) müssen den Fehler behandeln, bevor Aktionen wie ein
 * Gewinn-Payout ausgeführt werden.
 */
export function debitLoyalty(
  userLogin: string,
  amount: number,
  reason: LoyaltyTransactionReason,
  gameId: string | null = null
): LoyaltyTransaction {
  const account = getOrCreateAccount(userLogin)
  if (account.balance < amount) {
    throw new Error(`Unzureichender Kontostand für ${userLogin}: ${account.balance} < ${amount}`)
  }
  return applyTransaction(account.id, -amount, reason, gameId)
}
