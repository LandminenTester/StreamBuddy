/**
 * Fehler ueber die IPC-Grenze.
 *
 * Electron serialisiert eine abgelehnte ipcMain.handle-Promise verlustbehaftet: im
 * Renderer kommt nur noch die Message als String an, eingerahmt von einem eigenen
 * Praefix. Deshalb wird der stabile Fehlercode in die Message selbst geschrieben --
 * `[errors.oauth.deviceCodeExpired] Device-Code abgelaufen ...`.
 *
 * Der Renderer zieht den Code heraus und uebersetzt ihn; der deutsche Klartext
 * dahinter bleibt fuer Logs und als Notnagel erhalten, falls kein Key existiert.
 */

const CODE_PATTERN = /\[(errors\.[\w.]+)\]\s*(.*)/s

export function formatAppErrorMessage(code: string, detail: string): string {
  return `[${code}] ${detail}`
}

export interface ParsedAppError {
  /** i18n-Key, falls die Message einen Code trug. */
  code: string | null
  /** Klartext ohne Code-Praefix. */
  detail: string
}

export function parseAppErrorMessage(message: string): ParsedAppError {
  const match = message.match(CODE_PATTERN)
  if (!match) return { code: null, detail: message }
  return { code: match[1], detail: match[2].trim() }
}
