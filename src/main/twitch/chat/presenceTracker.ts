import type { Client } from 'tmi.js'

const presentUsers = new Set<string>()

type PresenceCallback = (userLogin: string) => void

let onJoinedCallback: PresenceCallback | null = null
let onLeftCallback: PresenceCallback | null = null

/** Registriert JOIN/PART-Listener, um eine Liste aktuell im Chat anwesender Namen zu führen. */
export function attachPresenceTracking(client: Client): void {
  client.on('join', (_channel, username, self) => {
    if (self) return
    const login = username.toLowerCase()
    presentUsers.add(login)
    onJoinedCallback?.(login)
  })

  client.on('part', (_channel, username, self) => {
    if (self) return
    const login = username.toLowerCase()
    presentUsers.delete(login)
    onLeftCallback?.(login)
  })
}

export function getPresentUsers(): string[] {
  return [...presentUsers]
}

export function clearPresence(): void {
  presentUsers.clear()
}

/** Registriert optionale Callbacks für Viewer-Session-Tracking. */
export function setPresenceCallbacks(callbacks: {
  onJoined: PresenceCallback
  onLeft: PresenceCallback
}): void {
  onJoinedCallback = callbacks.onJoined
  onLeftCallback = callbacks.onLeft
}
