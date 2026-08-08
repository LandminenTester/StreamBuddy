import { randomUUID } from 'node:crypto'
import type { AlertInstance, AlertRule, AlertRuleEventType } from '@shared/types/alertRule'
import { listAlertRules } from '../db/repositories/alertRules.repo'

/** Matched per "größte Schwelle ≤ tatsächlicher Wert" -- für gift_sub/raid, deren `condition` ein Zahlenstring ist. */
export function findBestThresholdRule(
  eventType: Extract<AlertRuleEventType, 'gift_sub' | 'raid'>,
  value: number
): AlertRule | null {
  const candidates = listAlertRules()
    .filter((rule) => rule.enabled && rule.eventType === eventType && rule.condition !== null)
    .map((rule) => ({ rule, threshold: Number(rule.condition) }))
    .filter((candidate) => Number.isFinite(candidate.threshold) && candidate.threshold <= value)
    .sort((a, b) => b.threshold - a.threshold)

  return candidates[0]?.rule ?? null
}

export function buildInstance(rule: AlertRule, placeholders: Record<string, string>): AlertInstance {
  let resolvedText = rule.text.template
  for (const [key, value] of Object.entries(placeholders)) {
    resolvedText = resolvedText.replaceAll(`{${key}}`, value)
  }

  return {
    id: randomUUID(),
    ruleId: rule.id,
    media: { ...rule.media },
    audio: { ...rule.audio },
    text: {
      startMs: rule.text.startMs,
      durationMs: rule.text.durationMs,
      fadeInMs: rule.text.fadeInMs,
      fadeOutMs: rule.text.fadeOutMs,
      resolvedText
    },
    linkedEffectId: rule.effectId
  }
}
