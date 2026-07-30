export type AutomessageMode = 'interval' | 'message_count'

export interface Automessage {
  id: number
  messages: string[]
  mode: AutomessageMode
  intervalMinutes: number | null
  messageCountThreshold: number | null
  minChatLinesSinceLast: number
  enabled: boolean
  lastSentAt: number | null
  createdAt: number
}

export type AutomessageInput = Omit<Automessage, 'id' | 'lastSentAt' | 'createdAt'>
