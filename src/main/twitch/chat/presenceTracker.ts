import type { Client } from 'tmi.js'

const presentUsers = new Set<string>()

/** Registriert JOIN/PART-Listener, um eine Liste aktuell im Chat anwesender Namen zu führen. */
export function attachPresenceTracking(client: Client): void {
  client.on('join', (_channel, username, self) => {
    if (!self) presentUsers.add(username.toLowerCase())
  })

  client.on('part', (_channel, username, self) => {
    if (!self) presentUsers.delete(username.toLowerCase())
  })
}

export function getPresentUsers(): string[] {
  return [...presentUsers]
}

export function clearPresence(): void {
  presentUsers.clear()
}
