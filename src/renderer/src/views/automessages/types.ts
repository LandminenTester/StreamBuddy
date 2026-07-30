import type { AutomessageMode } from '@shared/types/automessage'

export interface AutomessageFormState {
  id: number | null
  messagesInput: string
  mode: AutomessageMode
  intervalMinutes: number
  messageCountThreshold: number
  minChatLinesSinceLast: number
  enabled: boolean
}

export function emptyAutomessageForm(): AutomessageFormState {
  return {
    id: null,
    messagesInput: '',
    mode: 'interval',
    intervalMinutes: 30,
    messageCountThreshold: 20,
    minChatLinesSinceLast: 5,
    enabled: true
  }
}
