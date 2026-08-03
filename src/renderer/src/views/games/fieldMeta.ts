import { i18n, t } from '@renderer/i18n'

export interface GameFieldMeta {
  labelKey: string
  hintKey?: string
  /** Einheit hinter dem Wert, z.B. Sekunden oder Punkte. */
  unitKey?: string
  min?: number
  max?: number
  step?: number
}

/**
 * Metadaten der numerischen Spiel-Config-Felder. Ohne sie zeigt die Oberflaeche die
 * rohen Objekt-Keys (bettingWindowSeconds, greenPayoutMultiplier) als Label an.
 * Neue Felder ohne Eintrag fallen bewusst auf den Key zurueck, statt zu verschwinden.
 */
const FIELD_META: Record<string, GameFieldMeta> = {
  winChancePercent: {
    labelKey: 'games.fields.winChancePercent',
    hintKey: 'games.fields.winChancePercentHint',
    unitKey: 'games.units.percent',
    min: 1,
    max: 99
  },
  minBet: { labelKey: 'games.fields.minBet', unitKey: 'games.units.points', min: 1 },
  maxBet: {
    labelKey: 'games.fields.maxBet',
    hintKey: 'games.fields.maxBetHint',
    unitKey: 'games.units.points',
    min: 0
  },
  acceptWindowSeconds: {
    labelKey: 'games.fields.acceptWindowSeconds',
    hintKey: 'games.fields.acceptWindowSecondsHint',
    unitKey: 'games.units.seconds',
    min: 5
  },
  bettingWindowSeconds: {
    labelKey: 'games.fields.bettingWindowSeconds',
    hintKey: 'games.fields.bettingWindowSecondsHint',
    unitKey: 'games.units.seconds',
    min: 10
  },
  roundCooldownSeconds: {
    labelKey: 'games.fields.roundCooldownSeconds',
    hintKey: 'games.fields.roundCooldownSecondsHint',
    unitKey: 'games.units.seconds',
    min: 0
  },
  cooldownSeconds: {
    labelKey: 'games.fields.cooldownSeconds',
    hintKey: 'games.fields.cooldownSecondsHint',
    unitKey: 'games.units.seconds',
    min: 0
  },
  spinDelayMinSeconds: {
    labelKey: 'games.fields.spinDelayMinSeconds',
    hintKey: 'games.fields.spinDelayHint',
    unitKey: 'games.units.seconds',
    min: 1
  },
  spinDelayMaxSeconds: {
    labelKey: 'games.fields.spinDelayMaxSeconds',
    hintKey: 'games.fields.spinDelayHint',
    unitKey: 'games.units.seconds',
    min: 1
  },
  greenPayoutMultiplier: {
    labelKey: 'games.fields.greenPayoutMultiplier',
    hintKey: 'games.fields.payoutHint',
    unitKey: 'games.units.multiplier',
    min: 1
  },
  numberPayoutMultiplier: {
    labelKey: 'games.fields.numberPayoutMultiplier',
    hintKey: 'games.fields.payoutHint',
    unitKey: 'games.units.multiplier',
    min: 1
  }
}

export function fieldMeta(key: string): GameFieldMeta | undefined {
  return FIELD_META[key]
}

/** Uebersetztes Label eines Config-Felds; unbekannte Felder behalten ihren Key. */
export function fieldLabel(key: string): string {
  const meta = FIELD_META[key]
  return meta && i18n.global.te(meta.labelKey) ? t(meta.labelKey) : key
}

export function fieldHint(key: string): string | undefined {
  const meta = FIELD_META[key]
  return meta?.hintKey ? t(meta.hintKey) : undefined
}

/** Wert mit Einheit fuer die Read-only-Ansicht, z.B. "60 Sekunden". */
export function formatFieldValue(key: string, value: number): string {
  const meta = FIELD_META[key]
  if (!meta?.unitKey) return String(value)
  const unit = t(meta.unitKey)
  // Prozent und Multiplikator haengen ohne Leerzeichen am Wert.
  return unit === '%' || unit === '×' ? `${value}${unit}` : `${value} ${unit}`
}
