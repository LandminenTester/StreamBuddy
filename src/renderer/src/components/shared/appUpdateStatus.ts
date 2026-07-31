import type { UpdateStatus } from '@shared/types/appInfo'

export function updateStatusLabel(status: UpdateStatus): string {
  switch (status.state) {
    case 'checking':
      return 'Suche nach Updates…'
    case 'available':
      return `Update v${status.version} verfügbar -- wird heruntergeladen…`
    case 'downloading':
      return `Lädt herunter… ${status.percent ?? 0}%`
    case 'downloaded':
      return `Update v${status.version} bereit zur Installation.`
    case 'not-available':
      return 'Du hast die neueste Version.'
    case 'error':
      return `Update-Check fehlgeschlagen${status.message ? `: ${status.message}` : ''}.`
    default:
      return 'Noch nicht geprüft.'
  }
}
