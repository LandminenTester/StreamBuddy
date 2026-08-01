import { formatAppErrorMessage } from '@shared/errors'

/**
 * Fehler mit stabilem i18n-Code. Die Message traegt den Code als Praefix, damit er
 * die verlustbehaftete IPC-Serialisierung ueberlebt (siehe src/shared/errors.ts).
 */
export class AppError extends Error {
  readonly code: string

  /**
   * @param code i18n-Key, z.B. 'errors.oauth.deviceCodeExpired'
   * @param detail Deutscher Klartext fuer Logs und als Fallback ohne passenden Key
   */
  constructor(code: string, detail: string) {
    super(formatAppErrorMessage(code, detail))
    this.name = 'AppError'
    this.code = code
  }
}
