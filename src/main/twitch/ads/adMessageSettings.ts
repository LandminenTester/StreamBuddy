import type { AdMessageSettings } from '@shared/types/automessage'
import { getSetting, setSetting } from '../../db/repositories/appSettings.repo'

const ENABLED_KEY = 'ad_message_enabled'
const LEAD_SECONDS_KEY = 'ad_message_lead_seconds'
const TEXTS_KEY = 'ad_message_texts'
const LAST_SENT_FOR_KEY = 'ad_message_last_sent_for'

const DEFAULT_LEAD_SECONDS = 120
const DEFAULT_TEXTS = [
  '📢 Achtung, gleich kommt Werbung -- wir sind gleich zurück!',
  '📺 In Kürze startet eine kurze Werbepause, bleibt gerne da!'
]

export function getAdMessageSettings(): AdMessageSettings {
  const enabled = getSetting(ENABLED_KEY) === 'true'
  const leadSecondsRaw = getSetting(LEAD_SECONDS_KEY)
  const textsRaw = getSetting(TEXTS_KEY)

  return {
    enabled,
    leadSeconds: leadSecondsRaw ? Number(leadSecondsRaw) : DEFAULT_LEAD_SECONDS,
    texts: textsRaw ? (JSON.parse(textsRaw) as string[]) : DEFAULT_TEXTS
  }
}

export function setAdMessageSettings(settings: AdMessageSettings): void {
  setSetting(ENABLED_KEY, settings.enabled ? 'true' : 'false')
  setSetting(LEAD_SECONDS_KEY, String(settings.leadSeconds))
  setSetting(TEXTS_KEY, JSON.stringify(settings.texts))
}

export function getLastSentFor(): string | null {
  return getSetting(LAST_SENT_FOR_KEY)
}

export function setLastSentFor(nextAdAt: string): void {
  setSetting(LAST_SENT_FOR_KEY, nextAdAt)
}
