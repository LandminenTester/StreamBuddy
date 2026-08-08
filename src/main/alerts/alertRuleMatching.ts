import { randomUUID } from 'node:crypto'
import type { AlertInstance, AlertRule, AlertTextLayer, SubTier } from '@shared/types/alertRule'
import { listAlertRules } from '../db/repositories/alertRules.repo'

/** Matched per "größte Schwelle ≤ tatsächlicher Wert" -- für raid, dessen `condition` ein Zahlenstring ist. */
export function findBestThresholdRule(eventType: 'raid', value: number): AlertRule | null {
  const candidates = listAlertRules()
    .filter((rule) => rule.enabled && rule.eventType === eventType && rule.condition !== null)
    .map((rule) => ({ rule, threshold: Number(rule.condition) }))
    .filter((candidate) => Number.isFinite(candidate.threshold) && candidate.threshold <= value)
    .sort((a, b) => b.threshold - a.threshold)

  return candidates[0]?.rule ?? null
}

export interface SubContext {
  tier?: SubTier
  giftAmount?: number
}

/**
 * Löst die passende Textvorlage auf: für 'follow'/'raid' das einzelne `template`; für 'sub' entweder
 * den Tier-Text (`ctx.tier`) oder den Gift-Schwellen-Text mit der größten Schwelle ≤ `ctx.giftAmount`.
 */
function resolveTemplate(text: AlertTextLayer, ctx?: SubContext): string {
  if (ctx?.giftAmount !== undefined) {
    const sorted = [...(text.subGiftThresholds ?? [])].sort((a, b) => b.minAmount - a.minAmount)
    return sorted.find((t) => t.minAmount <= ctx.giftAmount!)?.template ?? ''
  }
  if (ctx?.tier) {
    return text.subTierTexts?.find((t) => t.tier === ctx.tier)?.template ?? ''
  }
  return text.template ?? ''
}

export function buildInstance(
  rule: AlertRule,
  placeholders: Record<string, string>,
  subContext?: SubContext
): AlertInstance {
  let resolvedText = resolveTemplate(rule.text, subContext)
  for (const [key, value] of Object.entries(placeholders)) {
    resolvedText = resolvedText.replaceAll(`{${key}}`, value)
  }

  return {
    id: randomUUID(),
    ruleId: rule.id,
    eventType: rule.eventType,
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
