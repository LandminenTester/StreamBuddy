import type { AlertRule, AlertRuleEventType } from '@shared/types/alertRule'

export const SUB_TIERS = ['1000', '2000', '3000', 'prime'] as const

export function eventTypeLabelKey(eventType: AlertRuleEventType): string {
  return `alerts.manager.events.${eventType}`
}

export function conditionLabel(rule: Pick<AlertRule, 'eventType' | 'condition'>): string {
  if (rule.eventType === 'raid' && rule.condition) return `${rule.condition}+`
  return '—'
}

export function placeholdersForEventType(eventType: AlertRuleEventType): string[] {
  switch (eventType) {
    case 'follow':
      return ['{user}']
    case 'sub':
      return ['{user}']
    case 'raid':
      return ['{user}', '{viewers}']
  }
}
