import type { UpdateStatus } from '@shared/types/appInfo'
import type { FeatureLabel } from './types'

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

/** Menschenlesbare Labels für die optionalen (togglebaren) Features. */
export const FEATURE_LABELS: FeatureLabel[] = [
  {
    key: 'channel_points',
    title: 'Kanalpunkte',
    description:
      'Custom Rewards verwalten und auf Redemptions reagieren. Achtung: Twitch verlangt für die Reward-Verwaltung ein Token des Broadcaster-Accounts selbst -- mit einem reinen Moderator-Bot-Account funktioniert nur das Reagieren auf bestehende Redemptions, nicht das Anlegen neuer Rewards über einen Mod-Token.'
  },
  {
    key: 'polls',
    title: 'Umfragen',
    description: 'Twitch-Polls direkt aus der App erstellen und live verfolgen.'
  },
  {
    key: 'loyalty_follow_sub',
    title: 'Loyalty: Follow/Sub-Belohnungen',
    description: 'Loyalty-Punkte automatisch für Follows, Subs und Gifted Subs vergeben.'
  }
]

export function labelForFeature(key: string): FeatureLabel | undefined {
  return FEATURE_LABELS.find((f) => f.key === key)
}
