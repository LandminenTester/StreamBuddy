import type { LoyaltyTransaction, LoyaltyTransactionReason } from '@shared/types/loyalty'
import {
  applyTransaction,
  getOrCreateAccount,
  listAllAccounts
} from '../db/repositories/loyalty.repo'

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

/**
 * Manuelle Punktevergabe/-entzug für eine, mehrere oder alle Nutzer (Rangliste
 * per CSV/UI editieren). `amount` positiv = geben, negativ = entziehen.
 * Legt fehlende Konten automatisch an (siehe getOrCreateAccount).
 */
export function applyManualAdjustment(
  userLogins: string[] | 'all',
  amount: number
): LoyaltyTransaction[] {
  const targets = userLogins === 'all' ? listAllAccounts().map((a) => a.userLogin) : userLogins

  return targets.map((userLogin) => {
    const account = getOrCreateAccount(userLogin)
    return applyTransaction(account.id, amount, 'manual_adjust', null)
  })
}

/**
 * Setzt den Kontostand eines Nutzers auf einen absoluten Zielwert, indem intern
 * die Differenz als `manual_adjust`-Transaktion gebucht wird -- so bleibt die
 * Ledger-Historie vollständig, statt den Kontostand direkt zu überschreiben.
 */
export function setAccountBalance(userLogin: string, targetBalance: number): LoyaltyTransaction {
  const account = getOrCreateAccount(userLogin)
  const diff = targetBalance - account.balance
  return applyTransaction(account.id, diff, 'manual_adjust', null)
}
