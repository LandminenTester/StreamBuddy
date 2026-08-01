import type { Automessage, AutomessageMode } from '@shared/types/automessage'
import type { SelectOption } from '@renderer/components/ui/AppSelect.vue'
import { t } from '@renderer/i18n'
import type { AutomessageFormState } from './types'

const MODES: AutomessageMode[] = ['interval', 'message_count']

export function modeLabel(mode: AutomessageMode): string {
  return t(`automessages.mode.${mode}`)
}

export function modeOptions(): SelectOption[] {
  return MODES.map((value) => ({ value, label: modeLabel(value) }))
}

export function automessageToFormState(automessage: Automessage): AutomessageFormState {
  return {
    id: automessage.id,
    messages: [...automessage.messages],
    mode: automessage.mode,
    intervalMinutes: automessage.intervalMinutes ?? 30,
    messageCountThreshold: automessage.messageCountThreshold ?? 20,
    minChatLinesSinceLast: automessage.minChatLinesSinceLast,
    enabled: automessage.enabled
  }
}

export function describeSchedule(automessage: Automessage): string {
  if (automessage.mode === 'interval') {
    return t('automessages.schedule.interval', { minutes: automessage.intervalMinutes })
  }
  return t('automessages.schedule.messageCount', { count: automessage.messageCountThreshold })
}
