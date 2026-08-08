import type { AlertRuleEventType, AlertRuleInput } from '@shared/types/alertRule'

export interface AlertRuleFormState extends AlertRuleInput {
  id: number | null
}

export function emptyAlertRuleForm(
  eventType: AlertRuleEventType,
  condition: string | null
): AlertRuleFormState {
  return {
    id: null,
    eventType,
    condition,
    media: {
      mediaType: 'video',
      mediaPath: null,
      startMs: 0,
      durationMs: 5000,
      fadeInMs: 0,
      fadeOutMs: 0
    },
    audio: {
      audioPath: null,
      volume: 100,
      startMs: 0,
      durationMs: 5000
    },
    text: {
      template: '',
      startMs: 0,
      durationMs: 5000,
      fadeInMs: 200,
      fadeOutMs: 200
    },
    effectId: null,
    enabled: true
  }
}
