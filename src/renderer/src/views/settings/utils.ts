import type { FeatureKey } from '@shared/types/auth'
import { i18n, t } from '@renderer/i18n'
import type { FeatureLabel } from './types'

/** Reihenfolge der optionalen (togglebaren) Features in der Oberflaeche. */
export const FEATURE_KEYS: FeatureKey[] = [
  'channel_points',
  'polls',
  'loyalty_follow_sub',
  'ad_schedule',
  'activity_feed',
  'stream_info',
  'shoutout'
]

/**
 * Uebersetztes Label eines Features. Unbekannte Keys (z.B. neue Features ohne Text)
 * liefern undefined, damit der Aufrufer auf den rohen Key zurueckfallen kann.
 */
export function labelForFeature(key: string): FeatureLabel | undefined {
  if (!i18n.global.te(`features.${key}.title`)) return undefined
  return {
    key: key as FeatureKey,
    title: t(`features.${key}.title`),
    description: t(`features.${key}.description`)
  }
}

export function featureLabels(): FeatureLabel[] {
  return FEATURE_KEYS.map((key) => labelForFeature(key)).filter(
    (label): label is FeatureLabel => label !== undefined
  )
}
