/**
 * Geteiltes Einsatz-Parsing für alle Loyalty-Games: unterstützt feste Beträge,
 * "all" (kompletter Kontostand) und "xx%" (Anteil des Kontostands). `maxBet`
 * folgt der Konvention 0 = kein Limit (siehe Loyalty-Games-UI in LoyaltyView.vue).
 */
export function parseBetAmount(
  raw: string | undefined,
  balance: number,
  minBet: number,
  maxBet: number
): number | null {
  if (!raw) return null

  const lower = raw.toLowerCase()
  let amount: number

  if (lower === 'all') {
    amount = balance
  } else if (lower.endsWith('%')) {
    const percent = Number(lower.slice(0, -1))
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return null
    amount = Math.floor(balance * (percent / 100))
  } else {
    amount = Number(raw)
  }

  if (!Number.isInteger(amount) || amount <= 0) return null
  if (amount < minBet) return null
  if (maxBet > 0 && amount > maxBet) return null
  if (amount > balance) return null

  return amount
}
