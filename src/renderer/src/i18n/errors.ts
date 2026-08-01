import { parseAppErrorMessage } from '@shared/errors'
import { i18n, t } from './index'

/**
 * Uebersetzt einen ueber IPC gereichten Fehler. Traegt er einen bekannten Code,
 * wird der uebersetzte Text genutzt; sonst bleibt der Klartext des Main-Prozesses
 * stehen -- besser eine deutsche Meldung als gar keine.
 * @param error Beliebiger Fehlerwert aus einem catch-Block
 */
export function translateError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const { code, detail } = parseAppErrorMessage(message)

  if (code && i18n.global.te(code)) return t(code)
  return detail || t('errors.unknown')
}
