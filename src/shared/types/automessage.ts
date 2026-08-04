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

export interface AdMessageSettings {
  enabled: boolean
  leadSeconds: number
  texts: string[]
}

export interface AdScheduleStatus {
  nextAdAt: string | null
  lastAdAt: string | null
  durationSeconds: number | null
  /** True, wenn der Scope `channel:read:ads` fehlt -- UI zeigt dann einen Reauth-Hinweis statt "kein Zeitplan". */
  scopeMissing: boolean
}
