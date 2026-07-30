import type { LoyaltyAccount } from '@shared/types/loyalty'

export interface LoyaltyCsvRow {
  userLogin: string
  balance: number
}

export interface LoyaltyCsvParseResult {
  rows: LoyaltyCsvRow[]
  errors: string[]
}

const EXPECTED_HEADER = 'userlogin,balance'

/**
 * Parst eine einfache `userLogin,balance`-CSV (Header-Zeile Pflicht). Fehlerhafte
 * Zeilen werden nicht stillschweigend übersprungen, sondern mit Zeilennummer
 * gesammelt zurückgegeben, damit der Nutzer die Datei gezielt korrigieren kann.
 */
export function parseLoyaltyCsv(content: string): LoyaltyCsvParseResult {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const rows: LoyaltyCsvRow[] = []
  const errors: string[] = []

  if (lines.length === 0) {
    return { rows, errors: ['Datei ist leer'] }
  }

  const header = lines[0].toLowerCase().replace(/\s+/g, '')
  if (header !== EXPECTED_HEADER) {
    errors.push(`Unerwartete Kopfzeile: "${lines[0]}" (erwartet: "userLogin,balance")`)
    return { rows, errors }
  }

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1
    const parts = lines[i].split(',').map((part) => part.trim())

    if (parts.length !== 2) {
      errors.push(`Zeile ${lineNumber}: erwartet genau 2 Spalten, gefunden ${parts.length}`)
      continue
    }

    const [userLogin, balanceRaw] = parts
    if (userLogin.length === 0) {
      errors.push(`Zeile ${lineNumber}: userLogin ist leer`)
      continue
    }

    const balance = Number(balanceRaw)
    if (!Number.isFinite(balance) || !Number.isInteger(balance)) {
      errors.push(`Zeile ${lineNumber}: balance "${balanceRaw}" ist keine ganze Zahl`)
      continue
    }

    rows.push({ userLogin: userLogin.toLowerCase(), balance })
  }

  return { rows, errors }
}

export function serializeLoyaltyCsv(accounts: LoyaltyAccount[]): string {
  const lines = ['userLogin,balance']
  for (const account of accounts) {
    lines.push(`${account.userLogin},${account.balance}`)
  }
  return lines.join('\n')
}
