export interface ChatConnectionStatus {
  connected: boolean
  channel: string | null
  lastError: string | null
}
