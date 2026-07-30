export interface ChatConnectionStatus {
  connected: boolean
  channel: string | null
  lastError: string | null
}

/** Eine einzelne Chat-Nachricht für den Live-Feed im Dashboard. */
export interface ChatFeedMessage {
  id: string
  username: string
  displayName: string
  color: string | null
  message: string
  timestamp: number
}
