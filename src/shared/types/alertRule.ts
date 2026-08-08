export type AlertRuleEventType = 'follow' | 'sub' | 'gift_sub' | 'raid'
export type MediaType = 'video' | 'gif' | 'image'

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

export interface AlertTextLayer {
  template: string
  startMs: number
  durationMs: number
  fadeInMs: number
  fadeOutMs: number
}

export interface AlertRule {
  id: number
  eventType: AlertRuleEventType
  /** null für 'follow'; '1000'|'2000'|'3000'|'prime' für 'sub'; numerischer Schwellenwert als String für 'gift_sub'/'raid'. */
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
