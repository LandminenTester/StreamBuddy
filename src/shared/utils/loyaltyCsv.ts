export type CsvDelimiter = ',' | ';' | '\t'

export interface LoyaltyCsvMapping {
  userLoginColumn: number
  balanceColumn: number
}

export interface LoyaltyCsvRow {
  userLogin: string
  balance: number
}

export interface LoyaltyCsvParseResult {
  rows: LoyaltyCsvRow[]
  errors: string[]
}

export interface LoyaltyCsvPreview {
  headers: string[]
  rows: string[][]
  mapping: LoyaltyCsvMapping
  parsedRows: LoyaltyCsvRow[]
  errors: string[]
}

export const CSV_DELIMITERS: CsvDelimiter[] = [',', ';', '\t']

const DEFAULT_MAPPING: LoyaltyCsvMapping = {
  userLoginColumn: 0,
  balanceColumn: 1
}

function splitCsvLine(line: string, delimiter: CsvDelimiter): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      index++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

export function parseCsvRecords(content: string, delimiter: CsvDelimiter): string[][] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => splitCsvLine(line, delimiter))
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function inferMapping(headers: string[]): LoyaltyCsvMapping {
  const normalized = headers.map(normalizeHeader)
  const userLoginColumn = normalized.findIndex((header) =>
    ['userlogin', 'login', 'user', 'username', 'name'].includes(header)
  )
  const balanceColumn = normalized.findIndex((header) =>
    ['balance', 'points', 'punkte', 'kontostand'].includes(header)
  )

  return {
    userLoginColumn: userLoginColumn >= 0 ? userLoginColumn : DEFAULT_MAPPING.userLoginColumn,
    balanceColumn: balanceColumn >= 0 ? balanceColumn : DEFAULT_MAPPING.balanceColumn
  }
}

export function parseLoyaltyCsv(
  content: string,
  delimiter: CsvDelimiter = ',',
  mapping?: LoyaltyCsvMapping
): LoyaltyCsvParseResult {
  const records = parseCsvRecords(content, delimiter)
  const rows: LoyaltyCsvRow[] = []
  const errors: string[] = []

  if (records.length === 0) {
    return { rows, errors: ['Datei ist leer'] }
  }

  const headers = records[0]
  const resolvedMapping = mapping ?? inferMapping(headers)

  for (let index = 1; index < records.length; index++) {
    const lineNumber = index + 1
    const record = records[index]
    const userLogin = record[resolvedMapping.userLoginColumn]?.trim() ?? ''
    const balanceRaw = record[resolvedMapping.balanceColumn]?.trim() ?? ''

    if (!userLogin) {
      errors.push(`Zeile ${lineNumber}: Nutzer/Login ist leer`)
      continue
    }

    const balance = Number(balanceRaw)
    if (!Number.isFinite(balance) || !Number.isInteger(balance)) {
      errors.push(`Zeile ${lineNumber}: Kontostand "${balanceRaw}" ist keine ganze Zahl`)
      continue
    }

    rows.push({ userLogin: userLogin.toLowerCase(), balance })
  }

  return { rows, errors }
}

export function previewLoyaltyCsv(
  content: string,
  delimiter: CsvDelimiter = ',',
  mapping?: LoyaltyCsvMapping,
  limit = 5
): LoyaltyCsvPreview {
  const records = parseCsvRecords(content, delimiter)
  const headers = records[0] ?? []
  const resolvedMapping = mapping ?? inferMapping(headers)
  const { rows: parsedRows, errors } = parseLoyaltyCsv(content, delimiter, resolvedMapping)

  return {
    headers,
    rows: records.slice(1, limit + 1),
    mapping: resolvedMapping,
    parsedRows: parsedRows.slice(0, limit),
    errors: errors.slice(0, limit)
  }
}
