const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30_000

let reconnectAttempts = 0
let reconnectTimer: NodeJS.Timeout | null = null

/** Plant einen Reconnect-Versuch mit exponentiellem Backoff (1s, 2s, 4s, ... max. 30s). */
export function scheduleReconnect(reconnectFn: () => void): void {
  const delay = Math.min(BASE_DELAY_MS * 2 ** reconnectAttempts, MAX_DELAY_MS)
  reconnectAttempts += 1

  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(reconnectFn, delay)
}

export function resetReconnectBackoff(): void {
  reconnectAttempts = 0
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

export function cancelScheduledReconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}
