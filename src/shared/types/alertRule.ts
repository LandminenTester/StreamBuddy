export type AlertRuleEventType = 'follow' | 'sub' | 'raid'
export type MediaType = 'video' | 'gif' | 'image'
export type SubTier = '1000' | '2000' | '3000' | 'prime'

export interface AlertMediaLayer {
  mediaType: MediaType
  mediaPath: string | null
  startMs: number
  durationMs: number
  fadeInMs: number
  fadeOutMs: number
}

export interface AlertAudioLayer {
  audioPath: string | null
  volume: number
  startMs: number
  durationMs: number
}

export interface SubTierText {
  tier: SubTier
  template: string
}

export interface SubGiftThreshold {
  minAmount: number
  template: string
}

export interface AlertTextLayer {
  /** Nur für 'follow'/'raid': einzelne Textvorlage. */
  template?: string
  /** Nur für 'sub': ein Text pro Tier. */
  subTierTexts?: SubTierText[]
  /** Nur für 'sub': Text pro Mindestanzahl gespendeter Subs, größte Schwelle ≤ tatsächlicher Menge gewinnt. */
  subGiftThresholds?: SubGiftThreshold[]
  startMs: number
  durationMs: number
  fadeInMs: number
  fadeOutMs: number
}

export interface AlertRule {
  id: number
  eventType: AlertRuleEventType
  /**
   * Nur für 'raid' genutzt: numerischer Mindest-Zuschauer-Schwellenwert als String, mehrere
   * Raid-Regeln mit unterschiedlichen Schwellen sind erlaubt (größte Schwelle ≤ tatsächlicher Wert
   * gewinnt, siehe findBestThresholdRule). Für 'follow' und 'sub' immer null -- pro Ereignistyp
   * existiert dort genau eine Regel; bei 'sub' unterscheidet stattdessen text.subTierTexts /
   * text.subGiftThresholds die Ausgabe.
   */
  condition: string | null
  media: AlertMediaLayer
  audio: AlertAudioLayer
  text: AlertTextLayer
  effectId: number | null
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export type AlertRuleInput = Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>

/** Vollständig aufgelöste Laufzeit-Instanz, die durch die Warteschlange/das Overlay läuft. */
export interface AlertInstance {
  id: string
  ruleId: number
  eventType: AlertRuleEventType
  media: AlertMediaLayer
  audio: AlertAudioLayer
  text: {
    startMs: number
    durationMs: number
    fadeInMs: number
    fadeOutMs: number
    resolvedText: string
  }
  linkedEffectId: number | null
}

export interface AlertQueueEntry {
  id: string
  eventType: AlertRuleEventType
  label: string
}

export interface AlertQueueState {
  current: AlertQueueEntry | null
  pending: AlertQueueEntry[]
}
