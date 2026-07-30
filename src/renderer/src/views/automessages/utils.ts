import type { Automessage, AutomessageMode } from '@shared/types/automessage'
import type { AutomessageFormState } from './types'

export const MODE_LABELS: Record<AutomessageMode, string> = {
  interval: 'Zeitintervall',
  message_count: 'Nach Chat-Nachrichten'
}

export function automessageToFormState(automessage: Automessage): AutomessageFormState {
  return {
    id: automessage.id,
    messagesInput: automessage.messages.join('\n'),
    mode: automessage.mode,
    intervalMinutes: automessage.intervalMinutes ?? 30,
    messageCountThreshold: automessage.messageCountThreshold ?? 20,
    minChatLinesSinceLast: automessage.minChatLinesSinceLast,
    enabled: automessage.enabled
  }
}

export function parseMessages(messagesInput: string): string[] {
  return messagesInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function describeSchedule(automessage: Automessage): string {
  if (automessage.mode === 'interval') {
    return `alle ${automessage.intervalMinutes} Min.`
  }
  return `alle ${automessage.messageCountThreshold} Nachrichten`
}
