import type { AlertRule, AlertRuleEventType } from '@shared/types/alertRule'

export const SUB_TIERS = ['1000', '2000', '3000', 'prime'] as const

export function eventTypeLabelKey(eventType: AlertRuleEventType): string {
  return `alerts.manager.events.${eventType}`
}

export function conditionLabel(rule: Pick<AlertRule, 'eventType' | 'condition'>): string {
  if (!rule.condition) return '—'
  if (rule.eventType === 'sub') return `alerts.manager.tiers.${rule.condition}`
  return `${rule.condition}+`
}

export function usedSubTiers(rules: AlertRule[], excludeId?: number): Set<string> {
  return new Set(
    rules
      .filter((r) => r.eventType === 'sub' && r.id !== excludeId && r.condition)
      .map((r) => r.condition as string)
  )
}

export function placeholdersForEventType(eventType: AlertRuleEventType): string[] {
  switch (eventType) {
    case 'follow':
      return ['{user}']
    case 'sub':
      return ['{user}']
    case 'gift_sub':
      return ['{user}', '{subcount}']
    case 'raid':
      return ['{user}', '{viewers}']
  }
}
