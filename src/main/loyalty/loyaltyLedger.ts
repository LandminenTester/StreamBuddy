import type { LoyaltyTransaction, LoyaltyTransactionReason } from '@shared/types/loyalty'
import {
  applyAccountTransfer,
  applyTransaction,
  getOrCreateAccount,
  listAllAccounts
} from '../db/repositories/loyalty.repo'

/**
 * Einzige Schreibstelle fuer Loyalty-Kontostaende. Jede Gutschrift/Abbuchung
 * erzeugt einen Ledger-Eintrag + atomare Balance-Fortschreibung (siehe
 * loyalty.repo.applyTransaction, in einer SQLite-Transaktion).
 *
 * Geblacklistete Konten (siehe loyalty.repo.setAccountBlacklisted) verdienen und
 * verlieren hierueber keine Punkte mehr -- betrifft automatisches Earn (Follow/Sub/
 * View-Time) und Game-Payouts. Manuelle Anpassungen laufen bewusst NICHT ueber
 * creditLoyalty/debitLoyalty (siehe applyManualAdjustment/setAccountBalance unten),
 * damit Admins geblacklistete Konten weiterhin gezielt bearbeiten koennen.
 */
export function creditLoyalty(
  userLogin: string,
  amount: number,
  reason: LoyaltyTransactionReason,
  gameId: string | null = null
): LoyaltyTransaction | null {
  const account = getOrCreateAccount(userLogin)
  if (account.isBlacklisted) return null
  return applyTransaction(account.id, amount, reason, gameId)
}

/**
 * Abbuchung (z.B. Spieleinsatz). Wirft, falls der Kontostand nicht ausreicht --
 * Aufrufer (Loyalty-Games) muessen den Fehler behandeln, bevor Aktionen wie ein
 * Gewinn-Payout ausgefuehrt werden.
 */
export function debitLoyalty(
  userLogin: string,
  amount: number,
  reason: LoyaltyTransactionReason,
  gameId: string | null = null
): LoyaltyTransaction | null {
  const account = getOrCreateAccount(userLogin)
  if (account.isBlacklisted) return null
  if (account.balance < amount) {
    throw new Error(`Unzureichender Kontostand fuer ${userLogin}: ${account.balance} < ${amount}`)
  }
  return applyTransaction(account.id, -amount, reason, gameId)
}

export interface LoyaltyTransferResult {
  fromBalance: number
  toBalance: number
}

/**
 * Verschiebt Punkte zwischen zwei normalen Loyalty-Konten. Beide Seiten werden
 * als Ledger-Transaktionen gebucht, damit der Verlauf nachvollziehbar bleibt.
 */
export function transferLoyaltyPoints(
  fromUserLogin: string,
  toUserLogin: string,
  amount: number
): LoyaltyTransferResult {
  const fromAccount = getOrCreateAccount(fromUserLogin)
  const toAccount = getOrCreateAccount(toUserLogin)

  if (fromAccount.isBlacklisted || toAccount.isBlacklisted) {
    throw new Error('Blacklisted accounts cannot transfer loyalty points')
  }
  if (fromAccount.userLogin === toAccount.userLogin) {
    throw new Error('Cannot transfer loyalty points to the same account')
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Transfer amount must be a positive integer')
  }
  if (fromAccount.balance < amount) {
    throw new Error(
      `Unzureichender Kontostand fuer ${fromAccount.userLogin}: ${fromAccount.balance} < ${amount}`
    )
  }

  return applyAccountTransfer(fromAccount.id, toAccount.id, amount, 'manual_adjust')
}

/**
 * Manuelle Punktevergabe/-entzug fuer eine, mehrere oder alle Nutzer (Rangliste
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
 * Ledger-Historie vollstaendig, statt den Kontostand direkt zu ueberschreiben.
 */
export function setAccountBalance(userLogin: string, targetBalance: number): LoyaltyTransaction {
  const account = getOrCreateAccount(userLogin)
  const diff = targetBalance - account.balance
  return applyTransaction(account.id, diff, 'manual_adjust', null)
}
