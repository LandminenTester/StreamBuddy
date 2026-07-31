import type { FeatureLabel } from './types'

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
  },
  {
    key: 'ad_schedule',
    title: 'Werbungsnachricht',
    description:
      'Kündigt bevorstehende Werbeunterbrechungen im Chat an. Achtung: Twitch verlangt hierfür zwingend ein Token des Broadcaster-Accounts selbst -- mit einem Moderator-Bot-Account funktioniert dieser Abruf nicht, da die Token-User-ID exakt dem Kanal entsprechen muss.'
  }
]

export function labelForFeature(key: string): FeatureLabel | undefined {
  return FEATURE_LABELS.find((f) => f.key === key)
}
